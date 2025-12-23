import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { telegramUser } = await req.json() as { telegramUser: TelegramUser }

    if (!telegramUser || !telegramUser.id) {
      throw new Error('Telegram user data is required')
    }

    console.log('Syncing Telegram user:', telegramUser.id)

    // Check if user already exists - using bolt_users table
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
      // Update existing user with latest Telegram data
      const { data: updatedUser, error: updateError } = await supabase
        .from('bolt_users')
        .update({
          telegram_username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          photo_url: telegramUser.photo_url,
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
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('bolt_users')
        .insert({
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          photo_url: telegramUser.photo_url,
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
    console.error('Sync Telegram user error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
