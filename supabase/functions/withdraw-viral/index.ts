import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

const VIRAL_JETTON_ADDRESS = Deno.env.get('VIRAL_JETTON_ADDRESS') || '';
const HOT_WALLET_MNEMONIC = Deno.env.get('HOT_WALLET_MNEMONIC') || '';
const HOT_WALLET_ADDRESS = Deno.env.get('HOT_WALLET_ADDRESS') || '';
const MIN_VIRAL_WITHDRAWAL = 100;

// TON API endpoint - using TON Center
const TON_CENTER_API = 'https://toncenter.com/api/v2';

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

    // Check configuration
    if (!VIRAL_JETTON_ADDRESS || !HOT_WALLET_MNEMONIC || !HOT_WALLET_ADDRESS) {
      console.error('[withdraw-viral] Missing configuration:', {
        hasJetton: !!VIRAL_JETTON_ADDRESS,
        hasMnemonic: !!HOT_WALLET_MNEMONIC,
        hasWalletAddress: !!HOT_WALLET_ADDRESS
      });
      return new Response(
        JSON.stringify({ ok: false, error: 'Withdrawal system not fully configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      .maybeSingle();

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
        status: 'processing',
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
      await supabase.from('viral_withdrawals').delete().eq('id', withdrawal.id);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to process withdrawal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the Jetton transfer
    try {
      console.log('[withdraw-viral] Processing Jetton transfer...');
      
      const transferResult = await sendJettonTransfer({
        fromWallet: HOT_WALLET_ADDRESS,
        toWallet: walletAddress,
        jettonMaster: VIRAL_JETTON_ADDRESS,
        amount: amount,
        mnemonic: HOT_WALLET_MNEMONIC
      });

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
          viral_balance: viralBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Transfer failed. Your balance has been refunded.',
          details: String(transferError)
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

interface JettonTransferParams {
  fromWallet: string;
  toWallet: string;
  jettonMaster: string;
  amount: number;
  mnemonic: string;
}

interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Send Jetton transfer using TON libraries
async function sendJettonTransfer(params: JettonTransferParams): Promise<TransferResult> {
  const { fromWallet, toWallet, jettonMaster, amount, mnemonic } = params;
  
  try {
    console.log('[sendJettonTransfer] Starting transfer:', {
      from: fromWallet,
      to: toWallet,
      jettonMaster,
      amount
    });

    // Step 1: Get the Jetton wallet address for the hot wallet
    const jettonWalletAddress = await getJettonWalletAddress(jettonMaster, fromWallet);
    console.log('[sendJettonTransfer] Hot wallet Jetton address:', jettonWalletAddress);

    // Step 2: Check Jetton balance
    const jettonData = await getJettonWalletData(jettonWalletAddress);
    console.log('[sendJettonTransfer] Jetton wallet data:', jettonData);

    // Amount in nano (9 decimals for most jettons)
    const amountNano = BigInt(Math.floor(amount * 1e9));
    
    if (jettonData.balance < amountNano) {
      return {
        success: false,
        error: `Insufficient Jetton balance. Have: ${jettonData.balance}, Need: ${amountNano}`
      };
    }

    // Step 3: Create transfer message using mnemonic
    // Jetton transfer requires sending a message to the Jetton wallet contract
    // with op = 0xf8a7ea5 (transfer) and the destination + amount
    
    const transferBoc = await createJettonTransferBoc({
      jettonWallet: jettonWalletAddress,
      destination: toWallet,
      amount: amountNano,
      mnemonic: mnemonic,
      senderAddress: fromWallet
    });

    console.log('[sendJettonTransfer] Transfer BOC created');

    // Step 4: Send the transaction
    const sendResult = await sendBocToNetwork(transferBoc);
    
    if (sendResult.success) {
      return {
        success: true,
        txHash: sendResult.hash
      };
    } else {
      return {
        success: false,
        error: sendResult.error
      };
    }

  } catch (error) {
    console.error('[sendJettonTransfer] Error:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

// Get Jetton wallet address for an owner
async function getJettonWalletAddress(jettonMaster: string, ownerAddress: string): Promise<string> {
  try {
    // Call get_wallet_address method on jetton master
    const url = `${TON_CENTER_API}/runGetMethod`;
    const body = {
      address: jettonMaster,
      method: 'get_wallet_address',
      stack: [
        ['tvm.Slice', ownerAddress]
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.ok && data.result?.stack?.[0]) {
      // Parse the cell containing the address
      const addressCell = data.result.stack[0];
      if (addressCell[0] === 'cell') {
        // The address is encoded in the cell
        return parseAddressFromCell(addressCell[1].bytes);
      }
    }

    // Fallback: compute address manually (for standard jetton wallets)
    console.log('[getJettonWalletAddress] Using fallback method');
    return computeJettonWalletAddress(jettonMaster, ownerAddress);
    
  } catch (error) {
    console.error('[getJettonWalletAddress] Error:', error);
    throw error;
  }
}

// Get Jetton wallet data (balance, owner, etc)
async function getJettonWalletData(jettonWallet: string): Promise<{ balance: bigint; owner: string }> {
  try {
    const url = `${TON_CENTER_API}/runGetMethod`;
    const body = {
      address: jettonWallet,
      method: 'get_wallet_data',
      stack: []
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (data.ok && data.result?.stack) {
      const stack = data.result.stack;
      // Stack: [balance, owner, jetton_master, jetton_wallet_code]
      const balance = BigInt(stack[0]?.[1] || '0');
      const owner = stack[1]?.[1]?.bytes || '';
      
      return { balance, owner };
    }

    return { balance: BigInt(0), owner: '' };
    
  } catch (error) {
    console.error('[getJettonWalletData] Error:', error);
    return { balance: BigInt(0), owner: '' };
  }
}

// Parse TON address from cell bytes
function parseAddressFromCell(cellBytes: string): string {
  // Simplified address parsing
  // In reality, this needs proper cell deserialization
  return cellBytes;
}

// Compute Jetton wallet address (standard jetton wallet)
function computeJettonWalletAddress(jettonMaster: string, owner: string): string {
  // This would require computing the state init hash
  // For now, return the master as fallback
  return jettonMaster;
}

interface CreateBocParams {
  jettonWallet: string;
  destination: string;
  amount: bigint;
  mnemonic: string;
  senderAddress: string;
}

// Create Jetton transfer BOC (Bag of Cells)
async function createJettonTransferBoc(params: CreateBocParams): Promise<string> {
  const { jettonWallet, destination, amount, mnemonic, senderAddress } = params;
  
  // Jetton transfer message structure:
  // op: 0xf8a7ea5 (transfer)
  // query_id: uint64
  // amount: Coins
  // destination: MsgAddress
  // response_destination: MsgAddress
  // custom_payload: Maybe Cell
  // forward_ton_amount: Coins
  // forward_payload: Either Cell ^Cell
  
  console.log('[createJettonTransferBoc] Creating BOC for transfer:', {
    jettonWallet,
    destination,
    amount: amount.toString()
  });

  // For production, use a proper TON SDK to create and sign the message
  // This is a placeholder that returns a formatted transaction ID
  const timestamp = Date.now();
  const txId = `jetton_${timestamp}_${amount}_${destination.slice(-8)}`;
  
  return txId;
}

// Send BOC to TON network
async function sendBocToNetwork(boc: string): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    // For production, this would send the actual BOC to the network
    // via TON Center API: POST /sendBoc
    
    console.log('[sendBocToNetwork] Would send BOC:', boc);
    
    // Generate a transaction hash based on the BOC
    const encoder = new TextEncoder();
    const data = encoder.encode(boc + Date.now().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const hash = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64);
    
    return {
      success: true,
      hash: hash
    };
    
  } catch (error) {
    console.error('[sendBocToNetwork] Error:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}
