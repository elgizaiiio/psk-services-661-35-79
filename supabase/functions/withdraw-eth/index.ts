import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

const MIN_ETH_WITHDRAWAL = 0.001;

interface WithdrawRequest {
  userId: string;
  walletAddress: string;
  amount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, walletAddress, amount } = await req.json() as WithdrawRequest;

    console.log('[withdraw-eth] Request:', { userId, walletAddress, amount });

    // Validate inputs
    if (!userId || !walletAddress || !amount) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ETH address format (basic check)
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid ETH wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount < MIN_ETH_WITHDRAWAL) {
      return new Response(
        JSON.stringify({ ok: false, error: `Minimum withdrawal is ${MIN_ETH_WITHDRAWAL} ETH` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user balance
    const { data: userData, error: userError } = await supabase
      .from('bolt_users')
      .select('eth_balance, telegram_username, first_name, telegram_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[withdraw-eth] User not found:', userError);
      return new Response(
        JSON.stringify({ ok: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ethBalance = userData.eth_balance ?? 0;
    
    if (ethBalance < amount) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Insufficient ETH balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending withdrawal
    const { data: pendingWithdrawal } = await supabase
      .from('eth_withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingWithdrawal) {
      return new Response(
        JSON.stringify({ ok: false, error: 'You already have a pending withdrawal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create withdrawal record (pending for manual processing)
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('eth_withdrawals')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        amount: amount,
        status: 'pending',
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('[withdraw-eth] Failed to create withdrawal:', withdrawalError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct balance immediately
    const { error: deductError } = await supabase
      .from('bolt_users')
      .update({ 
        eth_balance: ethBalance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (deductError) {
      console.error('[withdraw-eth] Failed to deduct balance:', deductError);
      await supabase.from('eth_withdrawals').delete().eq('id', withdrawal.id);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to process withdrawal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notify admin
    try {
      await supabase.functions.invoke('notify-admin-withdrawal', {
        body: {
          userId,
          username: userData.telegram_username || userData.first_name || 'Unknown',
          telegramId: userData.telegram_id,
          currency: 'ETH',
          amount,
          walletAddress,
          isAutomatic: false, // ETH requires manual processing
          withdrawalId: withdrawal.id
        }
      });
    } catch (notifyError) {
      console.error('[withdraw-eth] Failed to notify admin:', notifyError);
    }

    console.log('[withdraw-eth] Withdrawal request created:', withdrawal.id);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        withdrawalId: withdrawal.id,
        message: 'Withdrawal request submitted! It will be processed within 24 hours.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[withdraw-eth] Error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
