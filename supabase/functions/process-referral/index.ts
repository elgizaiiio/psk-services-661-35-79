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

    // Log the attempt
    const attemptData = {
      telegram_id,
      referral_param,
      metadata: {
        telegram_username,
        first_name,
        last_name,
        photo_url,
        initData,
        timestamp: new Date().toISOString()
      }
    }

    const { data: attempt } = await supabase
      .from('referral_attempts')
      .insert(attemptData)
      .select()
      .single()

    console.log(`📝 Logged referral attempt: ${attempt?.id}`)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('viral_users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (existingUser) {
      console.log(`👤 User already exists: ${existingUser.id}`)
      await supabase
        .from('referral_attempts')
        .update({ 
          error_message: 'User already exists',
          processed_at: new Date().toISOString()
        })
        .eq('id', attempt.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User already exists',
          user_id: existingUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new user first
    const { data: newUser, error: userError } = await supabase
      .from('viral_users')
      .insert({
        telegram_id,
        telegram_username,
        first_name,
        last_name,
        photo_url,
        token_balance: 0,
        mining_power_multiplier: 1,
        mining_duration_hours: 4
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ Error creating user:', userError)
      await supabase
        .from('referral_attempts')
        .update({ 
          error_message: `User creation failed: ${userError.message}`,
          processed_at: new Date().toISOString()
        })
        .eq('id', attempt.id)

      return new Response(
        JSON.stringify({ success: false, error: userError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ New user created: ${newUser.id}`)

    // Find referrer using multiple strategies
    let referrer = null
    
    // Strategy 1: Try exact username match
    if (referral_param) {
      const { data } = await supabase
        .from('viral_users')
        .select('id, telegram_username, telegram_id')
        .eq('telegram_username', referral_param)
        .single()
      
      if (data) {
        referrer = data
        console.log(`🎯 Found referrer by username: ${referrer.telegram_username}`)
      }
    }

    // Strategy 2: Try telegram_id match
    if (!referrer && referral_param && !isNaN(Number(referral_param))) {
      const { data } = await supabase
        .from('viral_users')
        .select('id, telegram_username, telegram_id')
        .eq('telegram_id', parseInt(referral_param))
        .single()
      
      if (data) {
        referrer = data
        console.log(`🎯 Found referrer by telegram_id: ${referrer.telegram_id}`)
      }
    }

    // Strategy 3: Case-insensitive username search
    if (!referrer && referral_param) {
      const { data } = await supabase
        .from('viral_users')
        .select('id, telegram_username, telegram_id')
        .ilike('telegram_username', referral_param)
        .single()
      
      if (data) {
        referrer = data
        console.log(`🎯 Found referrer by case-insensitive search: ${referrer.telegram_username}`)
      }
    }

    if (!referrer) {
      console.log(`❌ Referrer not found for param: ${referral_param}`)
      
      // Add to pending queue for later processing
      await supabase
        .from('pending_referrals')
        .insert({
          telegram_id,
          telegram_username,
          first_name,
          last_name,
          photo_url,
          referral_param,
          status: 'pending'
        })

      await supabase
        .from('referral_attempts')
        .update({ 
          error_message: 'Referrer not found - added to pending queue',
          processed_at: new Date().toISOString()
        })
        .eq('id', attempt.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Referrer not found, added to pending queue',
          user_id: newUser.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_id', newUser.id)
      .single()

    if (existingReferral) {
      console.log(`⚠️ Referral already exists: ${existingReferral.id}`)
      await supabase
        .from('referral_attempts')
        .update({ 
          referrer_found: true,
          referrer_id: referrer.id,
          error_message: 'Referral already exists',
          processed_at: new Date().toISOString()
        })
        .eq('id', attempt.id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Referral already exists',
          user_id: newUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the referral
    const { data: newReferral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUser.id,
        status: 'active',
        commission_rate: 10
      })
      .select()
      .single()

    if (referralError) {
      console.error('❌ Error creating referral:', referralError)
      await supabase
        .from('referral_attempts')
        .update({ 
          referrer_found: true,
          referrer_id: referrer.id,
          error_message: `Referral creation failed: ${referralError.message}`,
          processed_at: new Date().toISOString()
        })
        .eq('id', attempt.id)

      return new Response(
        JSON.stringify({ success: false, error: referralError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🎉 Referral created successfully: ${newReferral.id}`)

    // Update the attempt record
    await supabase
      .from('referral_attempts')
      .update({ 
        referrer_found: true,
        referrer_id: referrer.id,
        success: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', attempt.id)

    // Give referrer bonus
    const { data: currentReferrer } = await supabase
      .from('viral_users')
      .select('token_balance')
      .eq('id', referrer.id)
      .single()

    if (currentReferrer) {
      await supabase
        .from('viral_users')
        .update({
          token_balance: currentReferrer.token_balance + 100
        })
        .eq('id', referrer.id)
      
      console.log(`💰 Bonus of 100 tokens given to referrer: ${referrer.id}`)
    }

    // Create notification for referrer
    await supabase
      .from('notifications')
      .insert({
        user_id: referrer.id,
        title: '🎉 إحالة جديدة!',
        message: `لقد حصلت على 100 رمز مقابل إحالة ${first_name || telegram_username || 'مستخدم جديد'}`,
        type: 'success'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Referral processed successfully',
        user_id: newUser.id,
        referrer_id: referrer.id,
        bonus_given: 100
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})