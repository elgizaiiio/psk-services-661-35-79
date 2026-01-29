import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReferralRequest {
  telegram_id: number
  telegram_username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  referral_param: string
  initData?: any
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

async function sendTelegramNotification(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN not configured, skipping notification');
    return null;
  }
  
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
    console.log('Telegram notification sent:', result.ok);
    return result;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return null;
  }
}

async function updateContestParticipant(supabase: any, referrerId: string) {
  try {
    // Get active contest
    const { data: contest } = await supabase
      .from('referral_contests')
      .select('id')
      .eq('status', 'active')
      .eq('is_active', true)
      .single();

    if (!contest) {
      console.log('No active contest found');
      return null;
    }

    // Check if participant exists
    const { data: existingParticipant } = await supabase
      .from('contest_participants')
      .select('id, referral_count')
      .eq('contest_id', contest.id)
      .eq('user_id', referrerId)
      .single();

    if (existingParticipant) {
      // Update existing participant
      const { error } = await supabase
        .from('contest_participants')
        .update({
          referral_count: existingParticipant.referral_count + 1,
          last_referral_at: new Date().toISOString()
        })
        .eq('id', existingParticipant.id);

      if (error) {
        console.error('Error updating contest participant:', error);
      } else {
        console.log(`🏆 Contest participant updated: ${referrerId}, count: ${existingParticipant.referral_count + 1}`);
      }
      return existingParticipant.referral_count + 1;
    } else {
      // Create new participant
      const { error } = await supabase
        .from('contest_participants')
        .insert({
          contest_id: contest.id,
          user_id: referrerId,
          referral_count: 1,
          last_referral_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating contest participant:', error);
      } else {
        console.log(`🏆 New contest participant created: ${referrerId}`);
      }
      return 1;
    }
  } catch (error) {
    console.error('Error in updateContestParticipant:', error);
    return null;
  }
}

async function getContestRank(supabase: any, referrerId: string): Promise<{ rank: number; total: number } | null> {
  try {
    const { data: contest } = await supabase
      .from('referral_contests')
      .select('id')
      .eq('status', 'active')
      .eq('is_active', true)
      .single();

    if (!contest) return null;

    // Get user's referral count
    const { data: userPart } = await supabase
      .from('contest_participants')
      .select('referral_count')
      .eq('contest_id', contest.id)
      .eq('user_id', referrerId)
      .single();

    if (!userPart) return null;

    // Count participants with higher count
    const { count: higherCount } = await supabase
      .from('contest_participants')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contest.id)
      .gt('referral_count', userPart.referral_count);

    // Get total participants
    const { count: total } = await supabase
      .from('contest_participants')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contest.id);

    return {
      rank: (higherCount || 0) + 1,
      total: total || 0
    };
  } catch (error) {
    console.error('Error getting contest rank:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { telegram_id, telegram_username, first_name, last_name, photo_url, referral_param, initData } = await req.json() as ReferralRequest

    console.log(`🔗 Processing referral for Telegram ID: ${telegram_id}, param: ${referral_param}`)
    console.log(`📊 Init data:`, JSON.stringify(initData))

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('bolt_users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (existingUser) {
      console.log(`👤 User already exists: ${existingUser.id}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User already exists',
          user_id: existingUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find referrer using multiple strategies
    let referrer = null
    
    // Strategy 1: Try telegram_id match (most common for Telegram referrals)
    if (!referrer && referral_param && !isNaN(Number(referral_param))) {
      const { data } = await supabase
        .from('bolt_users')
        .select('id, telegram_username, telegram_id, first_name')
        .eq('telegram_id', parseInt(referral_param))
        .single()
      
      if (data) {
        referrer = data
        console.log(`🎯 Found referrer by telegram_id: ${referrer.telegram_id}`)
      }
    }

    // Strategy 2: Try exact username match
    if (!referrer && referral_param) {
      const { data } = await supabase
        .from('bolt_users')
        .select('id, telegram_username, telegram_id, first_name')
        .eq('telegram_username', referral_param)
        .single()
      
      if (data) {
        referrer = data
        console.log(`🎯 Found referrer by username: ${referrer.telegram_username}`)
      }
    }

    // Strategy 3: Case-insensitive username search
    if (!referrer && referral_param) {
      const { data } = await supabase
        .from('bolt_users')
        .select('id, telegram_username, telegram_id, first_name')
        .ilike('telegram_username', referral_param)
        .single()
      
      if (data) {
        referrer = data
        console.log(`🎯 Found referrer by case-insensitive search: ${referrer.telegram_username}`)
      }
    }

    // Create new user with referrer info
    const newUserData: any = {
      telegram_id,
      telegram_username,
      first_name,
      last_name,
      photo_url,
      token_balance: 0,
      mining_power: 2,
      mining_duration_hours: 4,
      total_referrals: 0,
      referral_bonus: 0
    }

    // Set referred_by if referrer found
    if (referrer) {
      newUserData.referred_by = referrer.id
    }

    const { data: newUser, error: userError } = await supabase
      .from('bolt_users')
      .insert(newUserData)
      .select()
      .single()

    if (userError) {
      console.error('❌ Error creating user:', userError)
      return new Response(
        JSON.stringify({ success: false, error: userError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ New user created: ${newUser.id}`)

    if (!referrer) {
      console.log(`❌ Referrer not found for param: ${referral_param}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User created but referrer not found',
          user_id: newUser.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('bolt_referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_id', newUser.id)
      .single()

    if (existingReferral) {
      console.log(`⚠️ Referral already exists: ${existingReferral.id}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Referral already exists',
          user_id: newUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the referral record
    const REFERRAL_BONUS = 100

    const { data: newReferral, error: referralError } = await supabase
      .from('bolt_referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUser.id,
        status: 'active',
        bonus_earned: REFERRAL_BONUS
      })
      .select()
      .single()

    if (referralError) {
      console.error('❌ Error creating referral:', referralError)
      return new Response(
        JSON.stringify({ success: false, error: referralError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🎉 Referral created successfully: ${newReferral.id}`)

    // Update contest participant
    const contestReferralCount = await updateContestParticipant(supabase, referrer.id);
    const contestRank = await getContestRank(supabase, referrer.id);

    // Give referrer bonus - update token_balance, total_referrals, and referral_bonus
    const { data: currentReferrer } = await supabase
      .from('bolt_users')
      .select('token_balance, total_referrals, referral_bonus, ton_balance, usdt_balance')
      .eq('id', referrer.id)
      .single()

    if (currentReferrer) {
      const newTotalReferrals = (currentReferrer.total_referrals || 0) + 1
      let totalBonus = REFERRAL_BONUS
      let milestoneBonus = 0

      // Check for old milestone bonuses (BOLT)
      if (newTotalReferrals === 5) {
        milestoneBonus = 500
        totalBonus += milestoneBonus
        console.log(`🏆 Milestone reached: 5 friends! Adding +500 BOLT bonus`)
      } else if (newTotalReferrals === 10) {
        milestoneBonus = 1500
        totalBonus += milestoneBonus
        console.log(`🏆 Milestone reached: 10 friends! Adding +1500 BOLT bonus`)
      }

      // NEW: Check for TON/USDT milestones
      let tonReward = 0
      let usdtReward = 0

      // Milestone: 3 friends = 0.1 TON
      if (newTotalReferrals === 3) {
        tonReward = 0.1
        console.log(`🎉 Milestone reached: 3 friends! Adding +0.1 TON reward`)
        
        // Record milestone
        await supabase.from('referral_milestone_rewards').upsert({
          user_id: referrer.id,
          milestone_type: 'invite_3',
          reward_currency: 'TON',
          reward_amount: tonReward,
          claimed: true,
          claimed_at: new Date().toISOString()
        }, { onConflict: 'user_id,milestone_type' })
      }

      // Milestone: 10 friends = 1 USDT
      if (newTotalReferrals === 10) {
        usdtReward = 1
        console.log(`🎉 Milestone reached: 10 friends! Adding +1 USDT reward`)
        
        // Record milestone
        await supabase.from('referral_milestone_rewards').upsert({
          user_id: referrer.id,
          milestone_type: 'invite_10',
          reward_currency: 'USDT',
          reward_amount: usdtReward,
          claimed: true,
          claimed_at: new Date().toISOString()
        }, { onConflict: 'user_id,milestone_type' })
      }

      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({
          token_balance: (currentReferrer.token_balance || 0) + totalBonus,
          total_referrals: newTotalReferrals,
          referral_bonus: (currentReferrer.referral_bonus || 0) + totalBonus,
          ton_balance: (currentReferrer.ton_balance || 0) + tonReward,
          usdt_balance: (currentReferrer.usdt_balance || 0) + usdtReward,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrer.id)
      
      if (updateError) {
        console.error('❌ Error updating referrer:', updateError)
      } else {
        console.log(`💰 Bonus of ${totalBonus} tokens given to referrer: ${referrer.id}`)
        if (tonReward > 0) console.log(`💎 TON reward of ${tonReward} given to referrer`)
        if (usdtReward > 0) console.log(`💵 USDT reward of ${usdtReward} given to referrer`)
      }

      // Send Telegram notification to referrer
      if (referrer.telegram_id) {
        const newUserName = first_name || telegram_username || 'A new user'
        let notificationText = `🎉 <b>New Referral!</b>\n\n<b>${newUserName}</b> joined using your link!\n\n💰 You earned: <b>+${REFERRAL_BONUS} BOLT</b>`
        
        if (milestoneBonus > 0) {
          notificationText += `\n\n🏆 <b>Milestone Bonus!</b>\nYou reached ${newTotalReferrals} friends!\n💎 Extra reward: <b>+${milestoneBonus.toLocaleString()} BOLT</b>`
        }

        // Add TON/USDT milestone notifications
        if (tonReward > 0) {
          notificationText += `\n\n🎁 <b>Special Reward!</b>\n3 friends milestone!\n💎 <b>+${tonReward} TON</b> added to your balance!`
        }
        if (usdtReward > 0) {
          notificationText += `\n\n🎁 <b>Special Reward!</b>\n10 friends milestone!\n💵 <b>+${usdtReward} USDT</b> added to your balance!`
        }
        
        notificationText += `\n\n👥 Total friends: <b>${newTotalReferrals}</b>`

        // Add contest info if participating
        if (contestReferralCount && contestRank) {
          notificationText += `\n\n🏆 <b>Contest Update!</b>\nYour rank: <b>#${contestRank.rank}</b> of ${contestRank.total}\nContest referrals: <b>${contestReferralCount}</b>`
          
          if (contestRank.rank <= 10) {
            notificationText += `\n🎯 You're in the prize zone!`
          }
        }

        await sendTelegramNotification(referrer.telegram_id, notificationText)
      }

      // Award free spin ticket to referrer
      const { data: spinTicketData } = await supabase
        .from('user_spin_tickets')
        .select('referral_tickets_count')
        .eq('user_id', referrer.id)
        .maybeSingle();

      const currentReferralTickets = spinTicketData?.referral_tickets_count || 0;
      
      await supabase
        .from('user_spin_tickets')
        .upsert({
          user_id: referrer.id,
          referral_tickets_count: currentReferralTickets + 1,
        }, { onConflict: 'user_id' });
      
      console.log(`🎟️ Free spin ticket awarded to referrer: ${referrer.id}`);
    }

    // Create social notification
    await supabase
      .from('bolt_social_notifications')
      .insert({
        user_id: referrer.id,
        username: first_name || telegram_username || 'New User',
        action_type: 'referral',
        amount: REFERRAL_BONUS
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Referral processed successfully',
        user_id: newUser.id,
        referrer_id: referrer.id,
        bonus_given: REFERRAL_BONUS,
        contest_rank: contestRank?.rank || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('❌ Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
