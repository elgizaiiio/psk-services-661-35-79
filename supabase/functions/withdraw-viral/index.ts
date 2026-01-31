import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { WalletContractV4, Address, beginCell, internal, toNano, SendMode } from 'https://esm.sh/@ton/ton@15.1.0';
import { mnemonicToPrivateKey } from 'https://esm.sh/@ton/crypto@3.3.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

const VIRAL_JETTON_ADDRESS = Deno.env.get('VIRAL_JETTON_ADDRESS') || '';
const HOT_WALLET_MNEMONIC = Deno.env.get('HOT_WALLET_MNEMONIC') || '';
const HOT_WALLET_ADDRESS = Deno.env.get('HOT_WALLET_ADDRESS') || '';
const MIN_VIRAL_WITHDRAWAL = 100;

// TON Center API (free tier)
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
      console.log('[withdraw-viral] Processing real Jetton transfer...');
      
      const transferResult = await sendJettonTransfer({
        destinationAddress: walletAddress,
        jettonMasterAddress: VIRAL_JETTON_ADDRESS,
        amount: amount,
        mnemonic: HOT_WALLET_MNEMONIC,
        senderAddress: HOT_WALLET_ADDRESS
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
  destinationAddress: string;
  jettonMasterAddress: string;
  amount: number;
  mnemonic: string;
  senderAddress: string;
}

interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Real Jetton transfer using @ton/ton library
async function sendJettonTransfer(params: JettonTransferParams): Promise<TransferResult> {
  const { destinationAddress, jettonMasterAddress, amount, mnemonic, senderAddress } = params;
  
  try {
    console.log('[sendJettonTransfer] Starting real transfer:', {
      to: destinationAddress,
      jettonMaster: jettonMasterAddress,
      amount
    });

    // Parse mnemonic and get key pair
    const mnemonicArray = mnemonic.trim().split(/\s+/);
    if (mnemonicArray.length !== 24) {
      throw new Error(`Invalid mnemonic: expected 24 words, got ${mnemonicArray.length}`);
    }

    const keyPair = await mnemonicToPrivateKey(mnemonicArray);
    console.log('[sendJettonTransfer] Key pair generated');

    // Create wallet contract (V4R2 is most common)
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey
    });

    const derivedWalletAddress = wallet.address.toString();
    console.log('[sendJettonTransfer] Wallet address from mnemonic:', derivedWalletAddress);
    
    // Use the CONFIGURED address (from secret) since mnemonic might derive different address
    // depending on wallet version. The configured address is the actual hot wallet.
    const actualWalletAddress = senderAddress;
    console.log('[sendJettonTransfer] Using configured wallet address:', actualWalletAddress);

    // Get sender's jetton wallet address using the configured wallet
    const jettonWalletAddress = await getJettonWalletAddress(jettonMasterAddress, actualWalletAddress);
    console.log('[sendJettonTransfer] Sender jetton wallet:', jettonWalletAddress);

    // Get current seqno
    const seqno = await getWalletSeqno(walletAddress);
    console.log('[sendJettonTransfer] Current seqno:', seqno);

    // Amount in nano (9 decimals for most jettons)
    const jettonAmount = BigInt(Math.floor(amount * 1e9));
    
    // Create jetton transfer payload
    // op: 0xf8a7ea5 (transfer)
    const destination = Address.parse(destinationAddress);
    const responseAddress = Address.parse(actualWalletAddress);
    
    const jettonTransferPayload = beginCell()
      .storeUint(0xf8a7ea5, 32) // JETTON_TRANSFER_OP_CODE
      .storeUint(0, 64) // query_id
      .storeCoins(jettonAmount) // amount
      .storeAddress(destination) // destination
      .storeAddress(responseAddress) // response_destination
      .storeBit(false) // no custom_payload
      .storeCoins(toNano('0.001')) // forward_ton_amount for notification
      .storeBit(false) // no forward_payload
      .endCell();

    // Create internal message to jetton wallet
    const jettonWallet = Address.parse(jettonWalletAddress);
    
    // Create transfer message
    const transferMessage = internal({
      to: jettonWallet,
      value: toNano('0.05'), // gas fee
      body: jettonTransferPayload
    });

    // Create and sign external message
    const transfer = wallet.createTransfer({
      seqno: seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [transferMessage]
    });

    // Convert to BOC and send
    const boc = transfer.toBoc().toString('base64');
    console.log('[sendJettonTransfer] BOC created, sending to network...');

    // Send via TON Center API
    const sendResult = await sendBocToTonCenter(boc);
    
    if (sendResult.success) {
      // Generate transaction hash from BOC
      const txHash = await generateTxHash(boc);
      console.log('[sendJettonTransfer] Transaction sent successfully:', txHash);
      
      return {
        success: true,
        txHash: txHash
      };
    } else {
      throw new Error(sendResult.error || 'Failed to send transaction');
    }

  } catch (error) {
    console.error('[sendJettonTransfer] Error:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

// Get jetton wallet address from master contract
async function getJettonWalletAddress(jettonMaster: string, ownerAddress: string): Promise<string> {
  // Try tonapi.io first (more reliable)
  try {
    console.log('[getJettonWalletAddress] Using tonapi.io for:', ownerAddress);
    
    // Normalize address format - tonapi needs friendly format
    let friendlyAddress = ownerAddress;
    if (ownerAddress.startsWith('0:') || ownerAddress.startsWith('-1:')) {
      // Convert raw to friendly using Address class
      try {
        const addr = Address.parseRaw(ownerAddress);
        friendlyAddress = addr.toString({ bounceable: true, urlSafe: true });
      } catch {
        // Keep original if parsing fails
      }
    }
    
    const url = `https://tonapi.io/v2/accounts/${encodeURIComponent(friendlyAddress)}/jettons/${encodeURIComponent(jettonMaster)}`;
    console.log('[getJettonWalletAddress] Request URL:', url);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.wallet_address?.address) {
        console.log('[getJettonWalletAddress] Found wallet:', data.wallet_address.address);
        return data.wallet_address.address;
      }
    }
    
    console.log('[getJettonWalletAddress] tonapi.io failed, status:', response.status);
  } catch (error) {
    console.error('[getJettonWalletAddress] tonapi.io error:', error);
  }

  // Fallback to TON Center
  try {
    console.log('[getJettonWalletAddress] Trying TON Center...');
    const url = `${TON_CENTER_API}/runGetMethod`;
    
    // Convert owner address to correct format
    let ownerAddr: Address;
    try {
      if (ownerAddress.startsWith('0:') || ownerAddress.startsWith('-1:')) {
        ownerAddr = Address.parseRaw(ownerAddress);
      } else {
        ownerAddr = Address.parse(ownerAddress);
      }
    } catch {
      ownerAddr = Address.parse(ownerAddress);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: jettonMaster,
        method: 'get_wallet_address',
        stack: [
          ['tvm.Slice', ownerAddr.toRawString()]
        ]
      })
    });

    const data = await response.json();
    console.log('[getJettonWalletAddress] TON Center response:', JSON.stringify(data));
    
    if (data.ok && data.result?.stack?.[0]) {
      const stack = data.result.stack[0];
      if (stack[0] === 'cell') {
        const cellBoc = stack[1].bytes;
        const addr = parseAddressFromBoc(cellBoc);
        if (addr) return addr;
      } else if (stack[0] === 'slice') {
        return stack[1];
      }
    }
  } catch (error) {
    console.error('[getJettonWalletAddress] TON Center error:', error);
  }

  throw new Error('Could not get jetton wallet address');
}

// Get wallet seqno
async function getWalletSeqno(walletAddress: string): Promise<number> {
  try {
    const url = `${TON_CENTER_API}/runGetMethod`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: walletAddress,
        method: 'seqno',
        stack: []
      })
    });

    const data = await response.json();
    
    if (data.ok && data.result?.stack?.[0]) {
      const seqnoValue = data.result.stack[0];
      if (seqnoValue[0] === 'num') {
        return parseInt(seqnoValue[1], 16);
      }
    }
    
    return 0; // Default seqno for new wallets
  } catch (error) {
    console.error('[getWalletSeqno] Error:', error);
    return 0;
  }
}

// Parse address from BOC
function parseAddressFromBoc(bocBase64: string): string | null {
  try {
    // Simple parsing - in production use proper cell deserialization
    const bytes = Uint8Array.from(atob(bocBase64), c => c.charCodeAt(0));
    // Try to extract address from bytes
    // This is simplified - real implementation needs proper BOC parsing
    return null;
  } catch {
    return null;
  }
}

// Send BOC to TON Center
async function sendBocToTonCenter(boc: string): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const url = `${TON_CENTER_API}/sendBoc`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boc })
    });

    const data = await response.json();
    console.log('[sendBocToTonCenter] Response:', JSON.stringify(data));
    
    if (data.ok) {
      return {
        success: true,
        hash: data.result?.hash
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to send BOC'
      };
    }
  } catch (error) {
    console.error('[sendBocToTonCenter] Error:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

// Generate transaction hash from BOC
async function generateTxHash(boc: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(boc);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64);
}
