import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const WEBAPP_URL = 'https://bolts.elgiza.site';

// Admin Telegram IDs that can use /101 and /102 commands
const ADMIN_IDS = [102, 6090594286, 6657246146, 7018562521];

interface TelegramUpdate {
  update_id: number;
  message?: {
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

async function createTask(title: string, url: string, image: string, reward: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bolt_tasks')
    .insert({
      title,
      task_url: url,
      icon: image,
      points: reward,
      category: 'social',
      is_active: true
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }
  return data;
}

// Admin Panel Functions
async function getAdminStats() {
  const supabase = getSupabaseClient();
  
  // Total users
  const { count: totalUsers } = await supabase
    .from('bolt_users')
    .select('*', { count: 'exact', head: true });
  
  // Active users in last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers } = await supabase
    .from('bolt_users')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', yesterday);
  
  // Total tokens
  const { data: tokenData } = await supabase
    .from('bolt_users')
    .select('token_balance');
  const totalTokens = tokenData?.reduce((sum, u) => sum + (u.token_balance || 0), 0) || 0;
  
  // Active mining sessions
  const { count: activeSessions } = await supabase
    .from('bolt_mining_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  // Total payments
  const { count: totalPayments } = await supabase
    .from('ton_payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');
  
  // Payment sum
  const { data: paymentData } = await supabase
    .from('ton_payments')
    .select('amount_ton')
    .eq('status', 'confirmed');
  const totalTonRevenue = paymentData?.reduce((sum, p) => sum + (p.amount_ton || 0), 0) || 0;
  
  // Total tasks
  const { count: totalTasks } = await supabase
    .from('bolt_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalTokens,
    activeSessions: activeSessions || 0,
    totalPayments: totalPayments || 0,
    totalTonRevenue,
    totalTasks: totalTasks || 0
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
  
  // Get all users with telegram_id
  const { data: users } = await supabase
    .from('bolt_users')
    .select('telegram_id');
  
  if (!users || users.length === 0) {
    return { sent: 0, failed: 0 };
  }
  
  let sent = 0;
  let failed = 0;
  
  // Send message to each user
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
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      failed++;
      console.error(`Error sending to ${user.telegram_id}:`, error);
    }
  }
  
  return { sent, failed };
}

async function handleAdminCommand(chatId: number, telegramId: number, messageText: string, photo?: any[]) {
  const state = await getAdminState(telegramId);
  
  // Check if user is admin
  if (!ADMIN_IDS.includes(telegramId)) {
    // Only respond if it's an admin command
    if (messageText.startsWith('/101') || messageText.startsWith('/102')) {
      await sendTelegramMessage(chatId, '❌ غير مصرح لك باستخدام هذا الأمر');
      return true;
    }
    return false;
  }

  // Handle /101 command - Admin Panel
  if (messageText === '/101' || messageText === '/101 stats') {
    const stats = await getAdminStats();
    
    const statsMessage = `🛡️ <b>لوحة تحكم المشرف</b>

📊 <b>الإحصائيات العامة:</b>
👥 إجمالي المستخدمين: <b>${stats.totalUsers.toLocaleString()}</b>
🟢 نشطين آخر 24 ساعة: <b>${stats.activeUsers.toLocaleString()}</b>
💰 إجمالي التوكنات: <b>${stats.totalTokens.toLocaleString()} BOLT</b>
⛏️ جلسات التعدين النشطة: <b>${stats.activeSessions}</b>

💳 <b>المدفوعات:</b>
📈 عدد المعاملات: <b>${stats.totalPayments}</b>
💎 إجمالي الإيرادات: <b>${stats.totalTonRevenue.toFixed(2)} TON</b>

📝 <b>المهام النشطة:</b> ${stats.totalTasks}

<b>الأوامر المتاحة:</b>
/101 stats - إحصائيات تفصيلية
/101 users - آخر 10 مستخدمين
/101 broadcast - إرسال رسالة للجميع
/102 - إضافة مهمة جديدة`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔧 فتح لوحة التحكم الكاملة',
            web_app: { url: `${WEBAPP_URL}/admin` }
          }
        ],
        [
          {
            text: '👥 آخر المستخدمين',
            callback_data: 'admin_users'
          },
          {
            text: '📢 إرسال رسالة',
            callback_data: 'admin_broadcast'
          }
        ],
        [
          {
            text: '➕ إضافة مهمة',
            callback_data: 'admin_add_task'
          }
        ]
      ]
    };

    await sendTelegramMessage(chatId, statsMessage, keyboard);
    return true;
  }

  // Handle /101 users - Recent users
  if (messageText === '/101 users') {
    const users = await getRecentUsers(10);
    
    let usersMessage = `👥 <b>آخر 10 مستخدمين مسجلين:</b>\n\n`;
    
    users.forEach((user, index) => {
      const username = user.telegram_username ? `@${user.telegram_username}` : user.first_name || 'مجهول';
      const date = new Date(user.created_at).toLocaleDateString('ar-EG');
      usersMessage += `${index + 1}. ${username}\n`;
      usersMessage += `   💰 ${user.token_balance.toLocaleString()} BOLT | 📅 ${date}\n\n`;
    });
    
    await sendTelegramMessage(chatId, usersMessage);
    return true;
  }

  // Handle /101 broadcast - Start broadcast
  if (messageText === '/101 broadcast') {
    await setAdminState(telegramId, 'broadcast_message', { action_type: 'broadcast' });
    await sendTelegramMessage(chatId, `📢 <b>إرسال رسالة جماعية</b>

أدخل الرسالة التي تريد إرسالها لجميع المستخدمين:

💡 يمكنك استخدام HTML للتنسيق:
• <code>&lt;b&gt;نص&lt;/b&gt;</code> للغامق
• <code>&lt;i&gt;نص&lt;/i&gt;</code> للمائل
• <code>&lt;a href="URL"&gt;رابط&lt;/a&gt;</code> للروابط

أرسل /cancel للإلغاء`);
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
    await sendTelegramMessage(chatId, `📝 <b>إنشاء مهمة جديدة</b>

الخطوة 1/4: أدخل اسم المهمة:

أرسل /cancel للإلغاء`);
    return true;
  }

  // Handle /cancel command
  if (messageText === '/cancel') {
    if (state) {
      await clearAdminState(telegramId);
      await sendTelegramMessage(chatId, '✅ تم إلغاء العملية');
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
        await sendTelegramMessage(chatId, `📢 <b>تأكيد الإرسال</b>

سيتم إرسال الرسالة التالية إلى <b>${stats.totalUsers}</b> مستخدم:

<blockquote>${messageText}</blockquote>

هل تريد المتابعة؟

أرسل <b>نعم</b> للتأكيد أو /cancel للإلغاء`);
        return true;
      }
      
      if (state.step === 'broadcast_confirm') {
        if (messageText.toLowerCase() === 'نعم' || messageText.toLowerCase() === 'yes') {
          await sendTelegramMessage(chatId, '⏳ جاري إرسال الرسالة...');
          
          const result = await broadcastMessage(state.broadcast_message!);
          await clearAdminState(telegramId);
          
          await sendTelegramMessage(chatId, `✅ <b>تم إرسال الرسالة!</b>

📤 تم الإرسال: <b>${result.sent}</b>
❌ فشل: <b>${result.failed}</b>`);
        } else {
          await clearAdminState(telegramId);
          await sendTelegramMessage(chatId, '❌ تم إلغاء الإرسال');
        }
        return true;
      }
    }

    // Handle task creation (action_type === 'task' or default)
    if (!state.action_type || state.action_type === 'task') {
      switch (state.step) {
        case 'title':
          await setAdminState(telegramId, 'url', { 
            action_type: 'task',
            task_title: messageText 
          });
          await sendTelegramMessage(chatId, `✅ تم حفظ اسم المهمة: <b>${messageText}</b>

الخطوة 2/4: أدخل رابط المهمة (URL):`);
          return true;

        case 'url':
          if (!messageText.startsWith('http')) {
            await sendTelegramMessage(chatId, '❌ يرجى إدخال رابط صحيح يبدأ بـ http أو https');
            return true;
          }
          await setAdminState(telegramId, 'image', { 
            action_type: 'task',
            task_title: state.task_title,
            task_url: messageText 
          });
          await sendTelegramMessage(chatId, `✅ تم حفظ الرابط

الخطوة 3/4: أرسل صورة المهمة أو أدخل رابط الصورة:`);
          return true;

        case 'image':
          let imageUrl = messageText;
          
          // Check if a photo was sent
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
          await sendTelegramMessage(chatId, `✅ تم حفظ الصورة

الخطوة 4/4: أدخل قيمة المكافأة (عدد النقاط):`);
          return true;

        case 'reward':
          const reward = parseInt(messageText);
          if (isNaN(reward) || reward <= 0) {
            await sendTelegramMessage(chatId, '❌ يرجى إدخال رقم صحيح موجب');
            return true;
          }
          
          try {
            const task = await createTask(
              state.task_title!,
              state.task_url!,
              state.task_image || '🎯',
              reward
            );
            
            await clearAdminState(telegramId);
            await sendTelegramMessage(chatId, `✅ <b>تم إنشاء المهمة بنجاح!</b>

📝 الاسم: ${state.task_title}
🔗 الرابط: ${state.task_url}
🎁 المكافأة: ${reward} نقطة

ID: ${task.id}`);
          } catch (error) {
            await sendTelegramMessage(chatId, `❌ حدث خطأ أثناء إنشاء المهمة: ${error.message}`);
          }
          return true;
      }
    }
  }

  return false;
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

    const messageText = update.message?.text || '';
    const chatId = update.message?.chat.id;
    const firstName = update.message?.from.first_name || 'User';
    const telegramId = update.message?.from.id;
    const photo = update.message?.photo;

    if (!chatId || !telegramId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for admin commands first
    const handledByAdmin = await handleAdminCommand(chatId, telegramId, messageText, photo);
    if (handledByAdmin) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

      const welcomeMessage = `👋 <b>Welcome ${firstName}!</b>

🚀 Welcome to <b>Bolt Mining</b> - Smart Mining Platform!

⚡ Start now and earn BOLT tokens for FREE
💎 Complete daily tasks to boost your earnings
🎁 Invite friends and get extra rewards

🏆 <b>$10,000 Referral Contest Active!</b>
Invite friends to compete for amazing prizes!

Click the button below to start mining! 👇`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🚀 Start Mining Now',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: '🏆 View Contest',
              web_app: { url: `${WEBAPP_URL}/contest` }
            }
          ],
          [
            {
              text: '📢 Join Our Channel',
              url: 'https://t.me/boltrs'
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
        const notFoundMessage = `❌ <b>Account Not Found</b>

You haven't started mining yet!
Use /start to begin your journey.`;
        await sendTelegramMessage(chatId, notFoundMessage);
      } else {
        const balanceMessage = `📊 <b>Your BOLT Stats</b>

💰 Balance: <b>${user.token_balance.toLocaleString()} BOLT</b>
⚡ Mining Power: <b>${user.mining_power}x</b>
⏱️ Mining Duration: <b>${user.mining_duration_hours}h</b>
👥 Total Referrals: <b>${user.total_referrals}</b>
🎁 Referral Earnings: <b>${user.referral_bonus.toLocaleString()} BOLT</b>

🚀 Keep mining to earn more!`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '⛏️ Open Mining App',
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
        const notFoundMessage = `❌ <b>Account Not Found</b>

You haven't started mining yet!
Use /start to begin your journey.`;
        await sendTelegramMessage(chatId, notFoundMessage);
      } else {
        const referralCode = user.telegram_username || telegramId;
        const referralLink = `https://t.me/boltrsbot?start=${referralCode}`;
        
        const referralMessage = `🎁 <b>Your Referral Link</b>

Share this link with friends:
<code>${referralLink}</code>

📊 <b>Your Stats:</b>
👥 Total Referrals: <b>${user.total_referrals}</b>
💰 Earnings: <b>${user.referral_bonus.toLocaleString()} BOLT</b>

🏆 <b>Rewards:</b>
• +100 BOLT per friend
• +500 BOLT at 5 friends
• +1500 BOLT at 10 friends

🏆 <b>Contest Active!</b>
Compete for $10,000 in TON prizes!

Share now and earn! 🚀`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🏆 View Contest Leaderboard',
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
        const noContestMessage = `🏆 <b>No Active Contest</b>

There's no referral contest active right now.
Check back later for upcoming contests!`;
        await sendTelegramMessage(chatId, noContestMessage);
      } else {
        let contestMessage = `🏆 <b>${contestInfo.name}</b>

💰 Prize Pool: <b>$${contestInfo.prizePool.toLocaleString()} in TON</b>
⏳ Time Remaining: <b>${contestInfo.timeRemaining}</b>

🥇 1st Place: <b>$3,000</b>
🥈 2nd Place: <b>$2,000</b>
🥉 3rd Place: <b>$1,500</b>
4th-10th: <b>$500 each</b>`;

        if (contestInfo.userRank) {
          contestMessage += `

📊 <b>Your Stats:</b>
Rank: <b>#${contestInfo.userRank.rank}</b>
Referrals: <b>${contestInfo.userRank.referrals}</b>`;
          
          if (contestInfo.userRank.rank <= 10) {
            contestMessage += `
🎯 <b>You're in the prize zone!</b>`;
          }
        }

        if (contestInfo.top3.length > 0) {
          contestMessage += `

🏅 <b>Top 3:</b>`;
          contestInfo.top3.forEach((p: any) => {
            const emoji = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉';
            contestMessage += `
${emoji} @${p.username} - ${p.count} refs`;
          });
        }

        contestMessage += `

Invite friends to climb the leaderboard! 🚀`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🏆 View Full Leaderboard',
                web_app: { url: `${WEBAPP_URL}/contest` }
              }
            ],
            [
              {
                text: '🔗 Get Referral Link',
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
      const helpMessage = `📚 <b>Available Commands</b>

/start - Start the bot & open mining app
/balance - Check your BOLT balance & stats
/referral - Get your referral link
/contest - View contest info & leaderboard
/help - Show this help message

🚀 <b>Quick Actions:</b>
• Tap the button below to start mining
• Invite friends to earn bonus BOLT
• Complete daily tasks for extra rewards
• Compete in the $10,000 referral contest!

💡 <b>Tips:</b>
• Mine daily to maximize earnings
• Upgrade mining power for faster rewards
• Extend mining duration for longer sessions`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🚀 Start Mining',
              web_app: { url: WEBAPP_URL }
            }
          ],
          [
            {
              text: '🏆 View Contest',
              web_app: { url: `${WEBAPP_URL}/contest` }
            }
          ],
          [
            {
              text: '📢 Join Channel',
              url: 'https://t.me/boltrs'
            }
          ]
        ]
      };

      await sendTelegramMessage(chatId, helpMessage, keyboard);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
