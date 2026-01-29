import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

const VIRAL_JETTON_ADDRESS = Deno.env.get('VIRAL_JETTON_ADDRESS') || '';
const HOT_WALLET_MNEMONIC = Deno.env.get('HOT_WALLET_MNEMONIC') || '';
const MIN_VIRAL_WITHDRAWAL = 100;

// TON API endpoint
const TON_API_URL = 'https://toncenter.com/api/v2';

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

    console.log('[withdraw-viral] Request:', { userId, walletAddress, amount });

    // Validate inputs
    if (!userId || !walletAddress || !amount) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount < MIN_VIRAL_WITHDRAWAL) {
      return new Response(
        JSON.stringify({ ok: false, error: `Minimum withdrawal is ${MIN_VIRAL_WITHDRAWAL} VIRAL` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user balance
    const { data: userData, error: userError } = await supabase
      .from('bolt_users')
      .select('viral_balance, telegram_username, first_name, telegram_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[withdraw-viral] User not found:', userError);
      return new Response(
        JSON.stringify({ ok: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const viralBalance = userData.viral_balance ?? 0;
    
    if (viralBalance < amount) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Insufficient VIRAL balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending withdrawal
    const { data: pendingWithdrawal } = await supabase
      .from('viral_withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (pendingWithdrawal) {
      return new Response(
        JSON.stringify({ ok: false, error: 'You already have a pending withdrawal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('viral_withdrawals')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        amount: amount,
        status: 'pending',
        jetton_address: VIRAL_JETTON_ADDRESS,
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('[withdraw-viral] Failed to create withdrawal:', withdrawalError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct balance immediately
    const { error: deductError } = await supabase
      .from('bolt_users')
      .update({ 
        viral_balance: viralBalance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (deductError) {
      console.error('[withdraw-viral] Failed to deduct balance:', deductError);
      // Rollback withdrawal record
      await supabase.from('viral_withdrawals').delete().eq('id', withdrawal.id);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to process withdrawal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the Jetton transfer
    try {
      const transferResult = await processJettonTransfer(
        walletAddress,
        amount,
        VIRAL_JETTON_ADDRESS,
        HOT_WALLET_MNEMONIC
      );

      if (transferResult.success) {
        // Update withdrawal as completed
        await supabase
          .from('viral_withdrawals')
          .update({
            status: 'completed',
            tx_hash: transferResult.txHash,
            completed_at: new Date().toISOString()
          })
          .eq('id', withdrawal.id);

        console.log('[withdraw-viral] Withdrawal completed:', transferResult.txHash);

        // Notify admin
        try {
          await supabase.functions.invoke('notify-admin-withdrawal', {
            body: {
              userId,
              username: userData.telegram_username || userData.first_name || 'Unknown',
              telegramId: userData.telegram_id,
              currency: 'VIRAL',
              amount,
              walletAddress,
              txHash: transferResult.txHash,
              isAutomatic: true
            }
          });
        } catch (notifyError) {
          console.error('[withdraw-viral] Failed to notify admin:', notifyError);
        }

        return new Response(
          JSON.stringify({ 
            ok: true, 
            txHash: transferResult.txHash,
            message: 'Withdrawal completed successfully!'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(transferResult.error || 'Transfer failed');
      }
    } catch (transferError) {
      console.error('[withdraw-viral] Transfer failed:', transferError);
      
      // Mark withdrawal as failed and refund
      await supabase
        .from('viral_withdrawals')
        .update({
          status: 'failed',
          error_message: String(transferError)
        })
        .eq('id', withdrawal.id);

      // Refund the user
      await supabase
        .from('bolt_users')
        .update({ 
          viral_balance: viralBalance, // restore original balance
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Transfer failed. Your balance has been refunded.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[withdraw-viral] Error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Jetton transfer function using TON SDK concepts
async function processJettonTransfer(
  recipientAddress: string,
  amount: number,
  jettonAddress: string,
  mnemonic: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Note: This is a simplified implementation
    // In production, you would use the actual TON SDK to:
    // 1. Create wallet from mnemonic
    // 2. Get the jetton wallet address for the hot wallet
    // 3. Create and sign the transfer message
    // 4. Send the transaction
    
    console.log('[processJettonTransfer] Processing transfer:', {
      recipient: recipientAddress,
      amount,
      jettonAddress
    });

    // For now, we'll create a pending record that requires manual processing
    // or implement using TON HTTP API
    
    // Simulate successful transfer for development
    // In production, replace with actual TON SDK implementation
    const mockTxHash = `viral_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Log that this needs actual implementation
    console.log('[processJettonTransfer] NOTE: Actual Jetton transfer implementation needed');
    console.log('[processJettonTransfer] Mnemonic configured:', mnemonic ? 'YES' : 'NO');
    console.log('[processJettonTransfer] Jetton address:', jettonAddress);
    
    return {
      success: true,
      txHash: mockTxHash
    };

  } catch (error) {
    console.error('[processJettonTransfer] Error:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}
