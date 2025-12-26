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
        .select('id, telegram_username, telegram_id')
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
        .select('id, telegram_username, telegram_id')
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
        .select('id, telegram_username, telegram_id')
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

    // Give referrer bonus - update token_balance, total_referrals, and referral_bonus
    const { data: currentReferrer } = await supabase
      .from('bolt_users')
      .select('token_balance, total_referrals, referral_bonus')
      .eq('id', referrer.id)
      .single()

    if (currentReferrer) {
      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({
          token_balance: (currentReferrer.token_balance || 0) + REFERRAL_BONUS,
          total_referrals: (currentReferrer.total_referrals || 0) + 1,
          referral_bonus: (currentReferrer.referral_bonus || 0) + REFERRAL_BONUS,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrer.id)
      
      if (updateError) {
        console.error('❌ Error updating referrer:', updateError)
      } else {
        console.log(`💰 Bonus of ${REFERRAL_BONUS} tokens given to referrer: ${referrer.id}`)
      }
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
        bonus_given: REFERRAL_BONUS
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
