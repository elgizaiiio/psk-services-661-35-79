import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-init-data, x-telegram-id',
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

async function validateInitData(initData: string, botToken: string): Promise<TelegramUser | null> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) return null;

    params.delete('hash');
    
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const encoder = new TextEncoder();
    
    // Create secret key from bot token using WebAppData
    const webAppDataKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const secretKeyBuffer = await crypto.subtle.sign(
      'HMAC',
      webAppDataKey,
      encoder.encode(botToken)
    );

    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(sortedParams)
    );
    
    const calculatedHash = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (calculatedHash !== hash) return null;

    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    
    // Allow 24 hours for testing
    if (now - authDate > 86400) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    return JSON.parse(userStr) as TelegramUser;
  } catch (error) {
    console.error('Error validating initData:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const initData = req.headers.get('x-telegram-init-data') || '';
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
    
    let telegramUser: TelegramUser | null = null;
    
    // Try to validate initData first
    if (initData && botToken) {
      telegramUser = await validateInitData(initData, botToken);
    }
    
    // Fallback: try to get from body (for dev/testing)
    if (!telegramUser) {
      try {
        const body = await req.json();
        if (body.telegramUser) {
          console.warn('Using unvalidated telegram user - for production use initData');
          telegramUser = body.telegramUser;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    if (!telegramUser) {
      console.error('No valid telegram user found');
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please open from Telegram.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting mining for user:', telegramUser.id);

    // Get or create user
    let { data: user, error: userError } = await supabaseClient
      .from('bolt_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      throw userError;
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: insertError } = await supabaseClient
        .from('bolt_users')
        .insert({
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          photo_url: telegramUser.photo_url,
          token_balance: 0,
          mining_power: 1,
          mining_duration_hours: 4,
          total_referrals: 0,
          referral_bonus: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }
      user = newUser;
      console.log('Created new user:', user.id);
    }

    // Check for existing active session
    const { data: existingSession, error: sessionCheckError } = await supabaseClient
      .from('bolt_mining_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionCheckError && sessionCheckError.code !== 'PGRST116') {
      console.error('Error checking session:', sessionCheckError);
      throw sessionCheckError;
    }

    if (existingSession) {
      const endTime = new Date(existingSession.end_time);
      const now = new Date();
      
      if (now < endTime) {
        console.log('Returning existing active session:', existingSession.id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            user, 
            session: existingSession,
            message: 'Existing mining session found'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Session expired, mark as inactive
        await supabaseClient
          .from('bolt_mining_sessions')
          .update({ is_active: false })
          .eq('id', existingSession.id);
      }
    }

    // Create new mining session
    const durationHours = user.mining_duration_hours || 4;
    const miningPower = user.mining_power || 1;
    const now = new Date();
    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const { data: newSession, error: insertSessionError } = await supabaseClient
      .from('bolt_mining_sessions')
      .insert({
        user_id: user.id,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        tokens_per_hour: 1.0,
        mining_power: miningPower,
        is_active: true
      })
      .select()
      .single();

    if (insertSessionError) {
      console.error('Error creating session:', insertSessionError);
      throw insertSessionError;
    }

    console.log('Created new mining session:', newSession.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user, 
        session: newSession,
        message: 'Mining session started'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in start-mining-session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
