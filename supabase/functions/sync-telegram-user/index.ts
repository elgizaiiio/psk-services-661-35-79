import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-init-data',
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

// Rate limiting per telegram_id
const syncAttempts = new Map<number, { count: number; resetTime: number }>();

function checkRateLimit(telegramId: number): boolean {
  const now = Date.now();
  const entry = syncAttempts.get(telegramId);
  
  if (!entry || now > entry.resetTime) {
    syncAttempts.set(telegramId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (entry.count >= 30) { // Max 30 syncs per minute
    return false;
  }
  
  entry.count++;
  return true;
}

// Input validation
function validateTelegramUser(user: unknown): user is TelegramUser {
  if (!user || typeof user !== 'object') return false;
  const u = user as Record<string, unknown>;
  
  if (typeof u.id !== 'number' || u.id <= 0) return false;
  if (typeof u.first_name !== 'string' || u.first_name.length === 0 || u.first_name.length > 256) return false;
  if (u.last_name !== undefined && (typeof u.last_name !== 'string' || u.last_name.length > 256)) return false;
  if (u.username !== undefined && (typeof u.username !== 'string' || u.username.length > 64)) return false;
  if (u.photo_url !== undefined && (typeof u.photo_url !== 'string' || u.photo_url.length > 1024)) return false;
  
  return true;
}

// Sanitize string input
function sanitize(str: string | undefined, maxLength: number = 256): string | null {
  if (!str) return null;
  // Remove any potential SQL injection or XSS characters
  return str.slice(0, maxLength).replace(/[<>'"\\]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json();
    const { telegramUser } = body as { telegramUser: unknown };

    // Validate input
    if (!validateTelegramUser(telegramUser)) {
      console.error('Invalid telegram user data:', telegramUser);
      return new Response(
        JSON.stringify({ error: 'Invalid user data format', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(telegramUser.id)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    console.log('Syncing Telegram user:', telegramUser.id);

    // Check if user already exists
    const { data: existingUser, error: getUserError } = await supabase
      .from('bolt_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single()

    if (getUserError && getUserError.code !== 'PGRST116') {
      console.error('Error fetching user:', getUserError)
      throw getUserError
    }

    let user
    
    if (existingUser) {
      // Update existing user with sanitized data
      const { data: updatedUser, error: updateError } = await supabase
        .from('bolt_users')
        .update({
          telegram_username: sanitize(telegramUser.username, 64),
          first_name: sanitize(telegramUser.first_name),
          last_name: sanitize(telegramUser.last_name),
          photo_url: sanitize(telegramUser.photo_url, 1024),
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user:', updateError)
        throw updateError
      }

      user = updatedUser
      console.log('Updated existing user:', user.id)
    } else {
      // Create new user with sanitized data
      const { data: newUser, error: createError } = await supabase
        .from('bolt_users')
        .insert({
          telegram_id: telegramUser.id,
          telegram_username: sanitize(telegramUser.username, 64),
          first_name: sanitize(telegramUser.first_name),
          last_name: sanitize(telegramUser.last_name),
          photo_url: sanitize(telegramUser.photo_url, 1024),
          token_balance: 0,
          mining_power: 2,
          mining_duration_hours: 4
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        throw createError
      }

      user = newUser
      console.log('Created new user:', user.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user,
        message: existingUser ? 'User profile updated' : 'User profile created'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync Telegram user error:', error)
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
