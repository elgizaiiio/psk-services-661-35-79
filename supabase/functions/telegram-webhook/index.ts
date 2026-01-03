import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const WEBAPP_URL = 'https://bolts.elgiza.site';

// Admin Telegram ID that can use /101 and /102 commands
const ADMIN_IDS = [6657246146];

interface SuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
  }>;
  date: number;
  successful_payment?: SuccessfulPayment;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name: string };
    data: string;
    message?: { chat: { id: number } };
  };
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  console.log('Telegram API response:', result);
  return result;
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || 'Processing...'
    }),
  });
}

async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`;
  
  const body: Record<string, unknown> = {
    pre_checkout_query_id: queryId,
    ok: ok,
  };

  if (!ok && errorMessage) {
    body.error_message = errorMessage;
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const data = await response.json();
    if (data.ok && data.result.file_path) {
      return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${data.result.file_path}`;
    }
  } catch (error) {
    console.error('Error getting file URL:', error);
  }
  return null;
}

async function getUserStats(telegramId: number) {
  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from('bolt_users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

async function getContestInfo(userId?: string) {
  const supabase = getSupabaseClient();

  const { data: contest } = await supabase
    .from('referral_contests')
    .select('*')
    .eq('status', 'active')
    .eq('is_active', true)
    .single();

  if (!contest) return null;

  const { data: top3 } = await supabase
    .from('contest_participants')
    .select('user_id, referral_count')
    .eq('contest_id', contest.id)
    .order('referral_count', { ascending: false })
    .limit(3);

  let top3WithNames: any[] = [];
  if (top3 && top3.length > 0) {
    const userIds = top3.map((p: any) => p.user_id);
    const { data: users } = await supabase
      .from('bolt_users')
      .select('id, telegram_username, first_name')
      .in('id', userIds);

    const usersMap: Record<string, any> = {};
    (users || []).forEach((u: any) => { usersMap[u.id] = u; });

    top3WithNames = top3.map((p: any, i: number) => ({
      rank: i + 1,
      username: usersMap[p.user_id]?.telegram_username || usersMap[p.user_id]?.first_name || 'Anonymous',
      count: p.referral_count
    }));
  }

  let userRank = null;
  if (userId) {
    const { data: userPart } = await supabase
      .from('contest_participants')
      .select('referral_count')
      .eq('contest_id', contest.id)
      .eq('user_id', userId)
      .single();

    if (userPart) {
      const { count } = await supabase
        .from('contest_participants')
        .select('*', { count: 'exact', head: true })
        .eq('contest_id', contest.id)
        .gt('referral_count', userPart.referral_count);

      userRank = {
        rank: (count || 0) + 1,
        referrals: userPart.referral_count
      };
    }
  }

  const endDate = new Date(contest.end_date);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    name: contest.name,
    prizePool: contest.prize_pool_usd,
    timeRemaining: `${days}d ${hours}h`,
    top3: top3WithNames,
    userRank
  };
}

// Admin functions
async function getAdminState(telegramId: number) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('admin_task_creation_state')
    .select('*')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return data;
}

async function setAdminState(telegramId: number, step: string, updates: Record<string, any> = {}) {
  const supabase = getSupabaseClient();
  await supabase
    .from('admin_task_creation_state')
    .upsert({
      telegram_id: telegramId,
      step,
      ...updates,
      created_at: new Date().toISOString()
    }, { onConflict: 'telegram_id' });
}

async function clearAdminState(telegramId: number) {
  const supabase = getSupabaseClient();
  await supabase
    .from('admin_task_creation_state')
    .delete()
    .eq('telegram_id', telegramId);
}

async function createTask(title: string, url: string, image: string, reward: number, partnershipId?: string, partnerTelegramId?: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bolt_tasks')
    .insert({
      title,
      task_url: url,
      icon: image,
      points: reward,
      category: 'social',
      is_active: true,
      partnership_id: partnershipId || null,
      partner_telegram_id: partnerTelegramId || null
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }
  return data;
}

// Partnership functions
async function createPartnershipRequest(telegramId: number, username: string | undefined, title: string, url: string, image: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partnership_requests')
    .insert({
      telegram_id: telegramId,
      telegram_username: username || null,
      task_title: title,
      task_url: url,
      task_image: image,
      points: 10,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating partnership request:', error);
    throw error;
  }
  return data;
}

async function getPendingPartnerships() {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('partnership_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return data || [];
}

async function approvePartnership(requestId: string, adminTelegramId: number) {
  const supabase = getSupabaseClient();
  
  // Get the partnership request
  const { data: request, error: fetchError } = await supabase
    .from('partnership_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  if (fetchError || !request) {
    throw new Error('Partnership request not found');
  }
  
  // Create the task
  const task = await createTask(
    request.task_title,
    request.task_url,
    request.task_image || '',
    request.points,
    request.id,
    request.telegram_id
  );
  
  // Update the partnership request
  await supabase
    .from('partnership_requests')
    .update({
      status: 'approved',
      approved_by: adminTelegramId,
      approved_at: new Date().toISOString(),
      task_id: task.id
    })
    .eq('id', requestId);
  
  return { request, task };
}

async function rejectPartnership(requestId: string, reason?: string) {
  const supabase = getSupabaseClient();
  
  const { data: request } = await supabase
    .from('partnership_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  await supabase
    .from('partnership_requests')
    .update({
      status: 'rejected',
      rejected_reason: reason || null
    })
    .eq('id', requestId);
  
  return request;
}

async function getPartnershipStats(telegramId: number) {
  const supabase = getSupabaseClient();
  
  // Get the user
  const { data: user } = await supabase
    .from('bolt_users')
    .select('id')
    .eq('telegram_id', telegramId)
    .single();
  
  // Count referrals they brought to us
  let referralsToUs = 0;
  if (user) {
    const { count } = await supabase
      .from('bolt_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);
    referralsToUs = count || 0;
  }
  
  // Get their partnership tasks and count completions
  const { data: partnerTasks } = await supabase
    .from('bolt_tasks')
    .select('id, title')
    .eq('partner_telegram_id', telegramId)
    .eq('is_active', true);
  
  let referralsToThem = 0;
  const tasksWithCompletions: { title: string; completions: number }[] = [];
  
  if (partnerTasks && partnerTasks.length > 0) {
    for (const task of partnerTasks) {
      const { count } = await supabase
        .from('bolt_completed_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', task.id);
      
      const completions = count || 0;
      referralsToThem += completions;
      tasksWithCompletions.push({ title: task.title, completions });
    }
  }
  
  // Get partnership request history
  const { data: requests } = await supabase
    .from('partnership_requests')
    .select('*')
    .eq('telegram_id', telegramId)
    .order('created_at', { ascending: false });
  
  return {
    referralsToUs,
    referralsToThem,
    tasks: tasksWithCompletions,
    requests: requests || []
  };
}

// Admin Panel Functions
async function getAdminStats() {
  const supabase = getSupabaseClient();
  
  const { count: totalUsers } = await supabase
    .from('bolt_users')
    .select('*', { count: 'exact', head: true });
  
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers } = await supabase
    .from('bolt_users')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', yesterday);
  
  const { data: tokenData } = await supabase
    .from('bolt_users')
    .select('token_balance');
  const totalTokens = tokenData?.reduce((sum, u) => sum + (u.token_balance || 0), 0) || 0;
  
  const { count: activeSessions } = await supabase
    .from('bolt_mining_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  const { count: totalPayments } = await supabase
    .from('ton_payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');
  
  const { data: paymentData } = await supabase
    .from('ton_payments')
    .select('amount_ton')
    .eq('status', 'confirmed');
  const totalTonRevenue = paymentData?.reduce((sum, p) => sum + (p.amount_ton || 0), 0) || 0;
  
  const { count: totalTasks } = await supabase
    .from('bolt_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  const { count: pendingPartnerships } = await supabase
    .from('partnership_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalTokens,
    activeSessions: activeSessions || 0,
    totalPayments: totalPayments || 0,
    totalTonRevenue,
    totalTasks: totalTasks || 0,
    pendingPartnerships: pendingPartnerships || 0
  };
}

// Get recent payments (TON and Stars)
async function getRecentPayments(limit: number = 15) {
  const supabase = getSupabaseClient();
  
  // Get TON payments
  const { data: tonPayments } = await supabase
    .from('ton_payments')
    .select('id, user_id, amount_ton, status, product_type, created_at, payment_method')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  // Get Stars payments
  const { data: starsPayments } = await supabase
    .from('stars_payments')
    .select('id, user_id, amount_stars, amount_usd, status, product_type, created_at, telegram_id')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  // Get payment stats
  const { count: totalTonPayments } = await supabase
    .from('ton_payments')
    .select('*', { count: 'exact', head: true });
  
  const { count: confirmedTonPayments } = await supabase
    .from('ton_payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');
  
  const { data: tonRevenueData } = await supabase
    .from('ton_payments')
    .select('amount_ton')
    .eq('status', 'confirmed');
  const totalTonRevenue = tonRevenueData?.reduce((sum, p) => sum + (p.amount_ton || 0), 0) || 0;
  
  const { count: totalStarsPayments } = await supabase
    .from('stars_payments')
    .select('*', { count: 'exact', head: true });
  
  const { count: completedStarsPayments } = await supabase
    .from('stars_payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');
  
  const { data: starsRevenueData } = await supabase
    .from('stars_payments')
    .select('amount_stars, amount_usd')
    .eq('status', 'completed');
  const totalStarsRevenue = starsRevenueData?.reduce((sum, p) => sum + (p.amount_stars || 0), 0) || 0;
  const totalUsdRevenue = starsRevenueData?.reduce((sum, p) => sum + (p.amount_usd || 0), 0) || 0;
  
  // Get user info for payments
  const userIds = [
    ...(tonPayments?.map(p => p.user_id) || []),
    ...(starsPayments?.map(p => p.user_id) || [])
  ].filter(Boolean);
  
  const { data: users } = await supabase
    .from('bolt_users')
    .select('id, telegram_username, first_name')
    .in('id', userIds);
  
  const userMap = new Map(users?.map(u => [u.id, u]) || []);
  
  return {
    tonPayments: tonPayments?.map(p => ({
      ...p,
      user: userMap.get(p.user_id)
    })) || [],
    starsPayments: starsPayments?.map(p => ({
      ...p,
      user: userMap.get(p.user_id)
    })) || [],
    stats: {
      totalTonPayments: totalTonPayments || 0,
      confirmedTonPayments: confirmedTonPayments || 0,
      totalTonRevenue,
      totalStarsPayments: totalStarsPayments || 0,
      completedStarsPayments: completedStarsPayments || 0,
      totalStarsRevenue,
      totalUsdRevenue
    }
  };
}

async function getRecentUsers(limit: number = 10) {
  const supabase = getSupabaseClient();
  
  const { data } = await supabase
    .from('bolt_users')
    .select('telegram_id, telegram_username, first_name, token_balance, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return data || [];
}

async function broadcastMessage(message: string): Promise<{ sent: number; failed: number }> {
  const supabase = getSupabaseClient();
  
  const { data: users } = await supabase
    .from('bolt_users')
    .select('telegram_id');
  
  if (!users || users.length === 0) {
    return { sent: 0, failed: 0 };
  }
  
  let sent = 0;
  let failed = 0;
  
  for (const user of users) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegram_id,
          text: message,
          parse_mode: 'HTML'
        }),
      });
      
      const result = await response.json();
      if (result.ok) {
        sent++;
      } else {
        failed++;
        console.log(`Failed to send to ${user.telegram_id}:`, result);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      failed++;
      console.error(`Error sending to ${user.telegram_id}:`, error);
    }
  }
  
  return { sent, failed };
}

// Handle partnership flow for any user
async function handlePartnershipFlow(chatId: number, telegramId: number, username: string | undefined, messageText: string, photo?: any[]) {
  const state = await getAdminState(telegramId);
  
  if (!state || state.action_type !== 'partnership') {
    return false;
  }
  
  switch (state.step) {
    case 'partnership_title':
      await setAdminState(telegramId, 'partnership_url', { 
        action_type: 'partnership',
        task_title: messageText 
      });
      await sendTelegramMessage(chatId, `✅ Task title saved: <b>${messageText}</b>

<b>Step 2/3:</b> Enter the task URL:`);
      return true;

    case 'partnership_url':
      if (!messageText.startsWith('http')) {
        await sendTelegramMessage(chatId, '⚠️ Please enter a valid URL starting with http or https');
        return true;
      }
      await setAdminState(telegramId, 'partnership_image', { 
        action_type: 'partnership',
        task_title: state.task_title,
        task_url: messageText 
      });
      await sendTelegramMessage(chatId, `✅ URL saved

<b>Step 3/3:</b> Send the task image (photo or URL):`);
      return true;

    case 'partnership_image':
      let imageUrl = messageText;
      
      if (photo && photo.length > 0) {
        const largestPhoto = photo[photo.length - 1];
        imageUrl = await getFileUrl(largestPhoto.file_id) || messageText;
      }
      
      try {
        // Create the partnership request
        const request = await createPartnershipRequest(
          telegramId,
          username,
          state.task_title!,
          state.task_url!,
          imageUrl
        );
        
        await clearAdminState(telegramId);
        
        // Notify the user
        await sendTelegramMessage(chatId, `✅ <b>Partnership Request Submitted!</b>

<b>Task:</b> ${state.task_title}
<b>URL:</b> ${state.task_url}
<b>Reward:</b> 10 BOLT

Your request is pending review. You'll be notified once it's approved.

Use /statistics to check your partnership stats.`);
        
        // Notify admin(s)
        for (const adminId of ADMIN_IDS) {
          const adminMessage = `🤝 <b>New Partnership Request!</b>

<b>From:</b> ${username ? `@${username}` : 'Unknown'} (ID: ${telegramId})
<b>Task:</b> ${state.task_title}
<b>URL:</b> ${state.task_url}
<b>Reward:</b> 10 BOLT`;

          const keyboard = {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve_partnership_${request.id}` },
                { text: '❌ Reject', callback_data: `reject_partnership_${request.id}` }
              ]
            ]
          };
          
          await sendTelegramMessage(adminId, adminMessage, keyboard);
        }
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await sendTelegramMessage(chatId, `❌ Error submitting request: ${errorMessage}`);
      }
      return true;
  }
  
  return false;
}

async function handleAdminCommand(chatId: number, telegramId: number, messageText: string, photo?: any[]) {
  // Check if user is admin FIRST before anything else
  if (!ADMIN_IDS.includes(telegramId)) {
    // Only respond to admin commands with error
    if (messageText.startsWith('/101') || messageText.startsWith('/102')) {
      await sendTelegramMessage(chatId, 'You are not authorized to use this command');
      return true;
    }
    // For regular users, just return false to let normal command handling continue
    return false;
  }

  // From here, only admins can proceed
  const state = await getAdminState(telegramId);

  // Handle /101 command - Admin Panel
  if (messageText === '/101' || messageText === '/101 stats') {
    const stats = await getAdminStats();
    
    const statsMessage = `<b>🔧 Admin Panel</b>

<b>📊 General Stats:</b>
👥 Total Users: <b>${stats.totalUsers.toLocaleString()}</b>
🟢 Active (24h): <b>${stats.activeUsers.toLocaleString()}</b>
⚡ Total Tokens: <b>${stats.totalTokens.toLocaleString()} BOLT</b>
⛏️ Active Mining: <b>${stats.activeSessions}</b>

<b>💰 Payments:</b>
📝 Transactions: <b>${stats.totalPayments}</b>
💎 Revenue: <b>${stats.totalTonRevenue.toFixed(2)} TON</b>

<b>📋 Active Tasks:</b> ${stats.totalTasks}
<b>🤝 Pending Partnerships:</b> ${stats.pendingPartnerships}

<b>📌 Commands:</b>
/101 stats - Detailed stats
/101 users - Recent 10 users
/101 payments - Payment transactions
/101 partnerships - View pending partnerships
/101 broadcast - Send message to all
/102 - Add new task`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📊 Open Full Panel',
            web_app: { url: `${WEBAPP_URL}/admin` }
          }
        ],
        [
          {
            text: '👥 Users',
            callback_data: 'admin_users'
          },
          {
            text: '💰 Payments',
            callback_data: 'admin_payments'
          }
        ],
        [
          {
            text: '🤝 Partnerships',
            callback_data: 'admin_partnerships'
          },
          {
            text: '➕ Add Task',
            callback_data: 'admin_add_task'
          }
        ],
        [
          {
            text: '📢 Broadcast',
            callback_data: 'admin_broadcast'
          }
        ]
      ]
    };

    await sendTelegramMessage(chatId, statsMessage, keyboard);
    return true;
  }

  // Handle /101 partnerships - View pending partnerships
  if (messageText === '/101 partnerships') {
    const pending = await getPendingPartnerships();
    
    if (pending.length === 0) {
      await sendTelegramMessage(chatId, `<b>🤝 Partnership Requests</b>

No pending partnership requests.`);
      return true;
    }
    
    let message = `<b>🤝 Pending Partnership Requests (${pending.length})</b>\n\n`;
    
    for (const req of pending.slice(0, 5)) {
      const username = req.telegram_username ? `@${req.telegram_username}` : `ID: ${req.telegram_id}`;
      const date = new Date(req.created_at).toLocaleDateString('en-US');
      message += `<b>${req.task_title}</b>
From: ${username}
URL: ${req.task_url}
Date: ${date}\n\n`;
    }
    
    if (pending.length > 5) {
      message += `...and ${pending.length - 5} more\n`;
    }
    
    // Create inline keyboards for each pending request
    const keyboards = pending.slice(0, 5).map(req => ({
      inline_keyboard: [
        [
          { text: `✅ Approve: ${req.task_title.slice(0, 20)}...`, callback_data: `approve_partnership_${req.id}` },
          { text: '❌', callback_data: `reject_partnership_${req.id}` }
        ]
      ]
    }));
    
    await sendTelegramMessage(chatId, message);
    
    // Send individual approval buttons
    for (let i = 0; i < Math.min(pending.length, 5); i++) {
      const req = pending[i];
      await sendTelegramMessage(chatId, `<b>${req.task_title}</b>`, keyboards[i]);
    }
    
    return true;
  }

  // Handle /101 payments - Payment transactions
  if (messageText === '/101 payments') {
    const payments = await getRecentPayments(10);
    
    let paymentsMessage = `<b>💰 Payment Transactions</b>\n\n`;
    
    paymentsMessage += `<b>📊 TON Stats:</b>\n`;
    paymentsMessage += `Total: ${payments.stats.totalTonPayments} | Confirmed: ${payments.stats.confirmedTonPayments}\n`;
    paymentsMessage += `Revenue: <b>${payments.stats.totalTonRevenue.toFixed(2)} TON</b>\n\n`;
    
    paymentsMessage += `<b>⭐ Stars Stats:</b>\n`;
    paymentsMessage += `Total: ${payments.stats.totalStarsPayments} | Completed: ${payments.stats.completedStarsPayments}\n`;
    paymentsMessage += `Revenue: <b>${payments.stats.totalStarsRevenue} ⭐</b> (~$${payments.stats.totalUsdRevenue.toFixed(2)})\n\n`;
    
    paymentsMessage += `<b>📝 Recent TON Payments:</b>\n`;
    if (payments.tonPayments.length === 0) {
      paymentsMessage += `No TON payments yet\n\n`;
    } else {
      payments.tonPayments.slice(0, 5).forEach((p: any, i: number) => {
        const username = p.user?.telegram_username ? `@${p.user.telegram_username}` : p.user?.first_name || 'Unknown';
        const status = p.status === 'confirmed' ? '✅' : p.status === 'pending' ? '⏳' : '❌';
        const date = new Date(p.created_at).toLocaleDateString('en-US');
        paymentsMessage += `${i + 1}. ${status} ${p.amount_ton} TON - ${username}\n`;
        paymentsMessage += `   ${p.product_type} | ${date}\n`;
      });
      paymentsMessage += `\n`;
    }
    
    paymentsMessage += `<b>⭐ Recent Stars Payments:</b>\n`;
    if (payments.starsPayments.length === 0) {
      paymentsMessage += `No Stars payments yet\n`;
    } else {
      payments.starsPayments.slice(0, 5).forEach((p: any, i: number) => {
        const username = p.user?.telegram_username ? `@${p.user.telegram_username}` : p.user?.first_name || 'Unknown';
        const status = p.status === 'completed' ? '✅' : p.status === 'pending' ? '⏳' : '❌';
        const date = new Date(p.created_at).toLocaleDateString('en-US');
        paymentsMessage += `${i + 1}. ${status} ${p.amount_stars}⭐ - ${username}\n`;
        paymentsMessage += `   ${p.product_type} | ${date}\n`;
      });
    }
    
    await sendTelegramMessage(chatId, paymentsMessage);
    return true;
  }


  // Handle /101 users - Recent users
  if (messageText === '/101 users') {
    const users = await getRecentUsers(10);
    
    let usersMessage = `<b>Recent 10 Users:</b>\n\n`;
    
    users.forEach((user, index) => {
      const username = user.telegram_username ? `@${user.telegram_username}` : user.first_name || 'Unknown';
      const date = new Date(user.created_at).toLocaleDateString('en-US');
      usersMessage += `${index + 1}. ${username}\n`;
      usersMessage += `   ${user.token_balance.toLocaleString()} BOLT | ${date}\n\n`;
    });
    
    await sendTelegramMessage(chatId, usersMessage);
    return true;
  }

  // Handle /101 broadcast - Start broadcast
  if (messageText === '/101 broadcast') {
    await setAdminState(telegramId, 'broadcast_message', { action_type: 'broadcast' });
    await sendTelegramMessage(chatId, `<b>Broadcast Message</b>

Enter the message to send to all users:

You can use HTML formatting:
<code>&lt;b&gt;text&lt;/b&gt;</code> for bold
<code>&lt;i&gt;text&lt;/i&gt;</code> for italic
<code>&lt;a href="URL"&gt;link&lt;/a&gt;</code> for links

Send /cancel to cancel`);
    return true;
  }

  // Handle /102 command to start task creation
  if (messageText === '/102') {
    await setAdminState(telegramId, 'title', { 
      action_type: 'task',
      task_title: null, 
      task_url: null, 
      task_image: null 
    });
    await sendTelegramMessage(chatId, `<b>Create New Task</b>

Step 1/4: Enter task title:

Send /cancel to cancel`);
    return true;
  }

  // Handle /cancel command
  if (messageText === '/cancel') {
    if (state) {
      await clearAdminState(telegramId);
      await sendTelegramMessage(chatId, 'Operation cancelled');
      return true;
    }
    return false;
  }

  // Handle ongoing admin state
  if (state) {
    // Handle broadcast confirmation
    if (state.action_type === 'broadcast') {
      if (state.step === 'broadcast_message') {
        await setAdminState(telegramId, 'broadcast_confirm', { 
          action_type: 'broadcast',
          broadcast_message: messageText 
        });
        
        const stats = await getAdminStats();
        await sendTelegramMessage(chatId, `<b>Confirm Send</b>

Message will be sent to <b>${stats.totalUsers}</b> users:

<blockquote>${messageText}</blockquote>

Send <b>yes</b> to confirm or /cancel to cancel`);
        return true;
      }
      
      if (state.step === 'broadcast_confirm') {
        if (messageText.toLowerCase() === 'yes') {
          await sendTelegramMessage(chatId, 'Sending message...');
          
          const result = await broadcastMessage(state.broadcast_message!);
          await clearAdminState(telegramId);
          
          await sendTelegramMessage(chatId, `<b>Message Sent!</b>

Sent: <b>${result.sent}</b>
Failed: <b>${result.failed}</b>`);
        } else {
          await clearAdminState(telegramId);
          await sendTelegramMessage(chatId, 'Broadcast cancelled');
        }
        return true;
      }
    }

    // Handle task creation
    if (!state.action_type || state.action_type === 'task') {
      switch (state.step) {
        case 'title':
          await setAdminState(telegramId, 'url', { 
            action_type: 'task',
            task_title: messageText 
          });
          await sendTelegramMessage(chatId, `Task title saved: <b>${messageText}</b>

Step 2/4: Enter task URL:`);
          return true;

        case 'url':
          if (!messageText.startsWith('http')) {
            await sendTelegramMessage(chatId, 'Please enter a valid URL starting with http or https');
            return true;
          }
          await setAdminState(telegramId, 'image', { 
            action_type: 'task',
            task_title: state.task_title,
            task_url: messageText 
          });
          await sendTelegramMessage(chatId, `URL saved

Step 3/4: Send task image or image URL:`);
          return true;

        case 'image':
          let imageUrl = messageText;
          
          if (photo && photo.length > 0) {
            const largestPhoto = photo[photo.length - 1];
            imageUrl = await getFileUrl(largestPhoto.file_id) || messageText;
          }
          
          await setAdminState(telegramId, 'reward', { 
            action_type: 'task',
            task_title: state.task_title,
            task_url: state.task_url,
            task_image: imageUrl
          });
          await sendTelegramMessage(chatId, `Image saved

Step 4/4: Enter reward amount (points):`);
          return true;

        case 'reward':
          const reward = parseInt(messageText);
          if (isNaN(reward) || reward <= 0) {
            await sendTelegramMessage(chatId, 'Please enter a valid positive number');
            return true;
          }
          
          try {
            const task = await createTask(
              state.task_title!,
              state.task_url!,
              state.task_image || '',
              reward
            );
            
            await clearAdminState(telegramId);
            await sendTelegramMessage(chatId, `<b>Task Created Successfully!</b>

Title: ${state.task_title}
URL: ${state.task_url}
Reward: ${reward} points

ID: ${task.id}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await sendTelegramMessage(chatId, `Error creating task: ${errorMessage}`);
          }
          return true;
      }
    }
  }

  return false;
}

// Handle callback queries (button clicks)
async function handleCallbackQuery(callbackQuery: any) {
  const callbackQueryId = callbackQuery.id;
  const data = callbackQuery.data;
  const chatId = callbackQuery.message?.chat?.id;
  const telegramId = callbackQuery.from.id;
  
  if (!chatId) return;
  
  // Handle partnership approval
  if (data.startsWith('approve_partnership_')) {
    if (!ADMIN_IDS.includes(telegramId)) {
      await answerCallbackQuery(callbackQueryId, 'Not authorized');
      return;
    }
    
    const requestId = data.replace('approve_partnership_', '');
    
    try {
      const { request, task } = await approvePartnership(requestId, telegramId);
      
      await answerCallbackQuery(callbackQueryId, 'Partnership approved!');
      await sendTelegramMessage(chatId, `✅ <b>Partnership Approved!</b>

Task "${request.task_title}" has been added.
Task ID: ${task.id}`);
      
      // Notify the partner
      await sendTelegramMessage(request.telegram_id, `🎉 <b>Partnership Approved!</b>

Your task "<b>${request.task_title}</b>" has been approved and is now live!

Users can now complete your task and you'll start receiving referrals.

Use /statistics to track your partnership performance.`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await answerCallbackQuery(callbackQueryId, 'Error approving');
      await sendTelegramMessage(chatId, `❌ Error: ${errorMessage}`);
    }
    return;
  }
  
  // Handle partnership rejection
  if (data.startsWith('reject_partnership_')) {
    if (!ADMIN_IDS.includes(telegramId)) {
      await answerCallbackQuery(callbackQueryId, 'Not authorized');
      return;
    }
    
    const requestId = data.replace('reject_partnership_', '');
    
    try {
      const request = await rejectPartnership(requestId);
      
      await answerCallbackQuery(callbackQueryId, 'Partnership rejected');
      await sendTelegramMessage(chatId, `❌ Partnership request rejected.`);
      
      // Notify the partner
      if (request) {
        await sendTelegramMessage(request.telegram_id, `❌ <b>Partnership Request Rejected</b>

Unfortunately, your task "<b>${request.task_title}</b>" was not approved.

You can submit a new request with /partnership.`);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await answerCallbackQuery(callbackQueryId, 'Error rejecting');
      await sendTelegramMessage(chatId, `❌ Error: ${errorMessage}`);
    }
    return;
  }
  
  await answerCallbackQuery(callbackQueryId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Bot token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle pre_checkout_query for Stars payments
    if (update.pre_checkout_query) {
      console.log('Processing pre_checkout_query:', update.pre_checkout_query);
      await answerPreCheckoutQuery(update.pre_checkout_query.id, true);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle successful_payment for Stars payments
    if (update.message?.successful_payment) {
      console.log('Processing successful_payment:', update.message.successful_payment);
      const payment = update.message.successful_payment;
      const telegramId = update.message.from.id;
      
      try {
        // Decode the payload
        let payloadData: any = {};
        try {
          const decodedPayload = atob(payment.invoice_payload);
          payloadData = JSON.parse(decodedPayload);
          console.log('Decoded payload:', payloadData);
        } catch (e) {
          console.error('Error decoding payload:', e);
          payloadData = { raw: payment.invoice_payload };
        }

        const supabase = getSupabaseClient();
        
        // Find the pending payment and update it
        const { data: pendingPayment, error: findError } = await supabase
          .from('stars_payments')
          .select('*')
          .eq('telegram_id', telegramId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (findError || !pendingPayment) {
          console.log('No pending payment found, creating new record');
          // Create new payment record
          await supabase
            .from('stars_payments')
            .insert({
              telegram_id: telegramId,
              user_id: payloadData.user_id || null,
              product_type: payloadData.product_type || 'unknown',
              product_id: payloadData.product_id || null,
              amount_stars: payment.total_amount,
              amount_usd: payment.total_amount * 0.02, // Approximate conversion
              status: 'completed',
              telegram_payment_id: payment.telegram_payment_charge_id
            });
        } else {
          console.log('Found pending payment:', pendingPayment.id);
          // Update existing payment
          const { error: updateError } = await supabase
            .from('stars_payments')
            .update({
              status: 'completed',
              telegram_payment_id: payment.telegram_payment_charge_id
            })
            .eq('id', pendingPayment.id);

          if (updateError) {
            console.error('Error updating payment:', updateError);
          } else {
            console.log('Payment updated successfully');
            
            // Apply the reward based on product type
            if (pendingPayment.product_type === 'token_purchase') {
              // Add tokens to user balance
              const tokensToAdd = Math.floor(pendingPayment.amount_stars * 50); // 50 tokens per star
              await supabase
                .from('bolt_users')
                .update({ 
                  token_balance: supabase.rpc('increment', { value: tokensToAdd })
                })
                .eq('id', pendingPayment.user_id);
              
              // Alternative: direct update
              const { data: user } = await supabase
                .from('bolt_users')
                .select('token_balance')
                .eq('id', pendingPayment.user_id)
                .single();
              
              if (user) {
                await supabase
                  .from('bolt_users')
                  .update({ token_balance: user.token_balance + tokensToAdd })
                  .eq('id', pendingPayment.user_id);
              }
              
              console.log(`Added ${tokensToAdd} tokens to user ${pendingPayment.user_id}`);
            } else if (pendingPayment.product_type === 'spin_tickets') {
              // Add spin tickets
              const ticketsToAdd = payloadData.quantity || Math.floor(pendingPayment.amount_stars / 21);
              const { data: existing } = await supabase
                .from('user_spin_tickets')
                .select('*')
                .eq('user_id', pendingPayment.user_id)
                .single();
              
              if (existing) {
                await supabase
                  .from('user_spin_tickets')
                  .update({ 
                    tickets_count: existing.tickets_count + ticketsToAdd 
                  })
                  .eq('user_id', pendingPayment.user_id);
              } else {
                await supabase
                  .from('user_spin_tickets')
                  .insert({
                    user_id: pendingPayment.user_id,
                    tickets_count: ticketsToAdd
                  });
              }
              
              console.log(`Added ${ticketsToAdd} spin tickets to user ${pendingPayment.user_id}`);
            }
          }
        }
        
        // Send confirmation message to user
        await sendTelegramMessage(
          update.message.chat.id,
          `✅ <b>Payment Successful!</b>\n\nThank you for your purchase!\nAmount: <b>${payment.total_amount} ⭐</b>\n\nYour rewards have been added to your account.`
        );
        
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageText = update.message?.text || '';
    const chatId = update.message?.chat.id;
    const firstName = update.message?.from.first_name || 'User';
    const telegramId = update.message?.from.id;
    const username = update.message?.from.username;
    const photo = update.message?.photo;

    if (!chatId || !telegramId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for ongoing partnership flow first (for any user)
    const partnershipHandled = await handlePartnershipFlow(chatId, telegramId, username, messageText, photo);
    if (partnershipHandled) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for admin commands
    const handledByAdmin = await handleAdminCommand(chatId, telegramId, messageText, photo);
    if (handledByAdmin) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle /partnership command - for any user
    if (messageText === '/partnership') {
      await setAdminState(telegramId, 'partnership_title', { 
        action_type: 'partnership',
        task_title: null, 
        task_url: null, 
        task_image: null 
      });
      await sendTelegramMessage(chatId, `🤝 <b>Partnership Request</b>

Submit your task for cross-promotion partnership.
Reward will be set to <b>10 BOLT</b> automatically.

<b>Step 1/3:</b> Enter the task title:

Send /cancel to cancel`);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle /statistics command - for any user
    if (messageText === '/statistics') {
      const stats = await getPartnershipStats(telegramId);
      const user = await getUserStats(telegramId);
      
      const referralCode = user?.telegram_username || telegramId;
      const referralLink = `https://t.me/boltrsbot?start=${referralCode}`;
      
      let statsMessage = `📊 <b>Your Partnership Statistics</b>

━━━━━━━━━━━━━━━━━━━━━━
👥 <b>You referred to us:</b> ${stats.referralsToUs} users
👥 <b>We referred to you:</b> ${stats.referralsToThem} users
━━━━━━━━━━━━━━━━━━━━━━`;

      if (stats.tasks.length > 0) {
        statsMessage += `\n\n📋 <b>Your Active Tasks:</b>`;
        stats.tasks.forEach(t => {
          statsMessage += `\n• ${t.title}: ${t.completions} clicks ✅`;
        });
      }
      
      if (stats.requests.length > 0) {
        const pending = stats.requests.filter(r => r.status === 'pending');
        const approved = stats.requests.filter(r => r.status === 'approved');
        const rejected = stats.requests.filter(r => r.status === 'rejected');
        
        statsMessage += `\n\n📝 <b>Request History:</b>`;
        statsMessage += `\n✅ Approved: ${approved.length}`;
        statsMessage += `\n⏳ Pending: ${pending.length}`;
        statsMessage += `\n❌ Rejected: ${rejected.length}`;
      }
      
      statsMessage += `\n\n🔗 <b>Your Referral Link:</b>
<code>${referralLink}</code>

Use /partnership to submit a new task.`;

      await sendTelegramMessage(chatId, statsMessage);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle /cancel command for any user
    if (messageText === '/cancel') {
      const state = await getAdminState(telegramId);
      if (state) {
        await clearAdminState(telegramId);
        await sendTelegramMessage(chatId, '❌ Operation cancelled');
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle /start command
    if (messageText.startsWith('/start')) {
      const parts = messageText.split(' ');
      const referralParam = parts.length > 1 ? parts.slice(1).join(' ').trim() : null;
      
      console.log('Start command received, referral param:', referralParam);

      let webAppUrl = WEBAPP_URL;
      if (referralParam) {
        webAppUrl = `${WEBAPP_URL}?ref=${encodeURIComponent(referralParam)}`;
      }

      const welcomeMessage = `<b>Welcome ${firstName}!</b>

Welcome to Bolt Mining - Smart Mining Platform!

Start now and earn BOLT tokens for FREE
Complete daily tasks to boost your earnings
Invite friends and get extra rewards

$10,000 Referral Contest Active!
Invite friends to compete for amazing prizes!

Click the button below to start mining!`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: 'Start Mining Now',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: 'View Contest',
              web_app: { url: `${WEBAPP_URL}/contest` }
            }
          ],
          [
            {
              text: '📢 Join Channel',
              url: 'https://t.me/boltcomm'
            }
          ]
        ]
      };

      await sendTelegramMessage(chatId, welcomeMessage, keyboard);
      console.log('Welcome message sent with webAppUrl:', webAppUrl);
    }

    // Handle /balance command
    else if (messageText === '/balance') {
      const user = await getUserStats(telegramId!);
      
      if (!user) {
        const notFoundMessage = `<b>Account Not Found</b>

You haven't started mining yet!
Use /start to begin your journey.`;
        await sendTelegramMessage(chatId, notFoundMessage);
      } else {
        const balanceMessage = `<b>Your BOLT Stats</b>

Balance: <b>${user.token_balance.toLocaleString()} BOLT</b>
Mining Power: <b>${user.mining_power}x</b>
Mining Duration: <b>${user.mining_duration_hours}h</b>
Total Referrals: <b>${user.total_referrals}</b>
Referral Earnings: <b>${user.referral_bonus.toLocaleString()} BOLT</b>

Keep mining to earn more!`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: 'Open Mining App',
                web_app: { url: WEBAPP_URL }
              }
            ]
          ]
        };

        await sendTelegramMessage(chatId, balanceMessage, keyboard);
      }
    }

    // Handle /referral command
    else if (messageText === '/referral') {
      const user = await getUserStats(telegramId!);
      
      if (!user) {
        const notFoundMessage = `<b>Account Not Found</b>

You haven't started mining yet!
Use /start to begin your journey.`;
        await sendTelegramMessage(chatId, notFoundMessage);
      } else {
        const referralCode = user.telegram_username || telegramId;
        const referralLink = `https://t.me/boltrsbot?start=${referralCode}`;
        
        const referralMessage = `<b>Your Referral Link</b>

Share this link with friends:
<code>${referralLink}</code>

<b>Your Stats:</b>
Total Referrals: <b>${user.total_referrals}</b>
Earnings: <b>${user.referral_bonus.toLocaleString()} BOLT</b>

<b>Rewards:</b>
+100 BOLT per friend
+500 BOLT at 5 friends
+1500 BOLT at 10 friends

<b>Contest Active!</b>
Compete for $10,000 in TON prizes!

Share now and earn!`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: 'View Contest Leaderboard',
                web_app: { url: `${WEBAPP_URL}/contest` }
              }
            ]
          ]
        };

        await sendTelegramMessage(chatId, referralMessage, keyboard);
      }
    }

    // Handle /contest command
    else if (messageText === '/contest') {
      const user = await getUserStats(telegramId!);
      const contestInfo = await getContestInfo(user?.id);

      if (!contestInfo) {
        const noContestMessage = `<b>No Active Contest</b>

There's no referral contest active right now.
Check back later for upcoming contests!`;
        await sendTelegramMessage(chatId, noContestMessage);
      } else {
        let contestMessage = `<b>${contestInfo.name}</b>

Prize Pool: <b>$${contestInfo.prizePool.toLocaleString()} in TON</b>
Time Remaining: <b>${contestInfo.timeRemaining}</b>

1st Place: <b>$3,000</b>
2nd Place: <b>$2,000</b>
3rd Place: <b>$1,500</b>
4th-10th: <b>$500 each</b>`;

        if (contestInfo.userRank) {
          contestMessage += `

<b>Your Stats:</b>
Rank: <b>#${contestInfo.userRank.rank}</b>
Referrals: <b>${contestInfo.userRank.referrals}</b>`;
          
          if (contestInfo.userRank.rank <= 10) {
            contestMessage += `
<b>You're in the prize zone!</b>`;
          }
        }

        if (contestInfo.top3.length > 0) {
          contestMessage += `

<b>Top 3:</b>`;
          contestInfo.top3.forEach((p: any) => {
            const emoji = p.rank === 1 ? '1.' : p.rank === 2 ? '2.' : '3.';
            contestMessage += `
${emoji} @${p.username} - ${p.count} refs`;
          });
        }

        contestMessage += `

Invite friends to climb the leaderboard!`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: 'View Full Leaderboard',
                web_app: { url: `${WEBAPP_URL}/contest` }
              }
            ],
            [
              {
                text: 'Get Referral Link',
                callback_data: 'get_referral'
              }
            ]
          ]
        };

        await sendTelegramMessage(chatId, contestMessage, keyboard);
      }
    }

    // Handle /help command
    else if (messageText === '/help') {
      const helpMessage = `<b>Available Commands</b>

/start - Start the bot and open mining app
/balance - Check your BOLT balance and stats
/referral - Get your referral link
/contest - View contest info and leaderboard
/partnership - Submit a partnership task request
/statistics - View your partnership statistics
/help - Show this help message

<b>Quick Actions:</b>
Tap the button below to start mining
Invite friends to earn bonus BOLT
Complete daily tasks for extra rewards
Compete in the $10,000 referral contest!

<b>Tips:</b>
Mine daily to maximize earnings
Upgrade mining power for faster rewards
Extend mining duration for longer sessions`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: 'Start Mining',
              web_app: { url: WEBAPP_URL }
            }
          ],
          [
            {
              text: 'View Contest',
              web_app: { url: `${WEBAPP_URL}/contest` }
            }
          ],
          [
            {
              text: '📢 Join Channel',
              url: 'https://t.me/boltcomm'
            }
          ]
        ]
      };

      await sendTelegramMessage(chatId, helpMessage, keyboard);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
