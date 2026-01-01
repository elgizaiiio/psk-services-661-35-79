import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Admin Telegram IDs to receive suspicious payment alerts
const ADMIN_CHAT_IDS = [6090594286, 6657246146, 7018562521];

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    console.log(`Alert sent to ${chatId}:`, result.ok);
    return result.ok;
  } catch (error) {
    console.error(`Failed to send alert to ${chatId}:`, error);
    return false;
  }
}

serve(async (req) => {
  console.log('notify-suspicious-payment called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Suspicious payment alert request:', JSON.stringify(body));
    
    const { 
      paymentId,
      userId, 
      amount,
      productType,
      description,
      walletAddress,
      txHash,
      createdAt,
      reason
    } = body;

    console.log('Processing suspicious payment alert:', { paymentId, userId, amount, reason });

    if (!paymentId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the alert severity
    const alertEmoji = reason === 'no_tx_hash' ? '🚨' : '⚠️';
    const reasonText = reason === 'no_tx_hash' 
      ? 'تم تأكيد الدفع بدون TX Hash حقيقي' 
      : reason || 'سبب غير محدد';

    // Format the alert message
    const message = `
${alertEmoji} <b>تنبيه: تحويل مشبوه!</b> ${alertEmoji}

🔴 <b>السبب:</b> ${reasonText}

💰 <b>المبلغ:</b> ${amount} TON
🛍️ <b>المنتج:</b> ${productType || 'N/A'}
📝 <b>الوصف:</b> ${description || 'N/A'}

👤 <b>معرف المستخدم:</b> <code>${userId}</code>
💳 <b>عنوان المحفظة:</b> <code>${walletAddress || 'غير متوفر'}</code>
🔗 <b>TX Hash:</b> ${txHash ? `<code>${txHash}</code>` : '<b>❌ لا يوجد!</b>'}

🆔 <b>معرف الدفع:</b> <code>${paymentId}</code>
📅 <b>التاريخ:</b> ${createdAt ? new Date(createdAt).toLocaleString('ar-EG') : new Date().toLocaleString('ar-EG')}

⚡ <b>الإجراء المطلوب:</b>
قم بمراجعة هذا التحويل في لوحة الإدارة وإلغائه إذا كان مزيفاً.
    `.trim();

    // Send alert to all admins
    const results = await Promise.allSettled(
      ADMIN_CHAT_IDS.map(chatId => sendTelegramMessage(chatId, message))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`Alerted ${successCount}/${ADMIN_CHAT_IDS.length} admins about suspicious payment`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: successCount,
        total: ADMIN_CHAT_IDS.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing suspicious payment alert:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send alerts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
