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
    
    if (initData && botToken) {
      telegramUser = await validateInitData(initData, botToken);
    }
    
    if (!telegramUser) {
      try {
        const body = await req.json();
        if (body.telegramUser) {
          telegramUser = body.telegramUser;
        }
      } catch {
        // Ignore
      }
    }

    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabaseClient
      .from('bolt_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: true, user: null, session: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active session
    const { data: session, error: sessionError } = await supabaseClient
      .from('bolt_mining_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError && sessionError.code !== 'PGRST116') {
      throw sessionError;
    }

    // Check if session is expired
    if (session) {
      const endTime = new Date(session.end_time);
      const now = new Date();
      
      if (now >= endTime) {
        // Auto-complete expired session
        const startTime = new Date(session.start_time).getTime();
        const elapsedHours = (endTime.getTime() - startTime) / (1000 * 60 * 60);
        const tokensPerHour = Number(session.tokens_per_hour) || 1;
        const miningPower = Number(session.mining_power) || 1;
        const totalReward = Math.floor(elapsedHours * tokensPerHour * miningPower);

        // Update session
        await supabaseClient
          .from('bolt_mining_sessions')
          .update({
            is_active: false,
            completed_at: new Date().toISOString(),
            total_mined: totalReward
          })
          .eq('id', session.id);

        // Update user balance
        const newBalance = (Number(user.token_balance) || 0) + totalReward;
        const { data: updatedUser } = await supabaseClient
          .from('bolt_users')
          .update({ token_balance: newBalance })
          .eq('id', user.id)
          .select()
          .single();

        console.log('Auto-completed expired session:', session.id, 'Reward:', totalReward);

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: updatedUser || user, 
            session: null,
            completedSession: {
              id: session.id,
              totalReward,
              newBalance
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, user, session }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-mining-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
