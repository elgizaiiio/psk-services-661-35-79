import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('🔄 Processing pending referrals...')

    // Get pending referrals that are ready for retry
    const { data: pendingReferrals, error: fetchError } = await supabase
      .from('pending_referrals')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 5) // Max 5 retries
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error('❌ Error fetching pending referrals:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!pendingReferrals || pendingReferrals.length === 0) {
      console.log('✅ No pending referrals to process')
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending referrals' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0
    let successful = 0

    for (const pending of pendingReferrals) {
      console.log(`🔄 Processing pending referral for ${pending.telegram_id}, param: ${pending.referral_param}`)

      // Mark as processing
      await supabase
        .from('pending_referrals')
        .update({ status: 'processing' })
        .eq('id', pending.id)

      try {
        // Look for the referrer again
        let referrer = null

        // Strategy 1: Try exact username match
        const { data: usernameMatch } = await supabase
          .from('viral_users')
          .select('id, telegram_username, telegram_id')
          .eq('telegram_username', pending.referral_param)
          .single()

        if (usernameMatch) {
          referrer = usernameMatch
          console.log(`🎯 Found referrer by username: ${referrer.telegram_username}`)
        }

        // Strategy 2: Try telegram_id match
        if (!referrer && !isNaN(Number(pending.referral_param))) {
          const { data: idMatch } = await supabase
            .from('viral_users')
            .select('id, telegram_username, telegram_id')
            .eq('telegram_id', parseInt(pending.referral_param))
            .single()

          if (idMatch) {
            referrer = idMatch
            console.log(`🎯 Found referrer by telegram_id: ${referrer.telegram_id}`)
          }
        }

        if (!referrer) {
          // Still not found, increment retry count and schedule next retry
          const nextRetry = new Date()
          nextRetry.setHours(nextRetry.getHours() + Math.pow(2, pending.retry_count)) // Exponential backoff

          await supabase
            .from('pending_referrals')
            .update({
              status: 'pending',
              retry_count: pending.retry_count + 1,
              next_retry_at: nextRetry.toISOString()
            })
            .eq('id', pending.id)

          console.log(`⏳ Referrer still not found, retry ${pending.retry_count + 1}/5 scheduled`)
          processed++
          continue
        }

        // Find the referred user
        const { data: referredUser } = await supabase
          .from('viral_users')
          .select('id')
          .eq('telegram_id', pending.telegram_id)
          .single()

        if (!referredUser) {
          console.log(`❌ Referred user not found for telegram_id: ${pending.telegram_id}`)
          await supabase
            .from('pending_referrals')
            .update({ status: 'failed' })
            .eq('id', pending.id)
          processed++
          continue
        }

        // Check if referral already exists
        const { data: existingReferral } = await supabase
          .from('referrals')
          .select('id')
          .eq('referrer_id', referrer.id)
          .eq('referred_id', referredUser.id)
          .single()

        if (existingReferral) {
          console.log(`⚠️ Referral already exists`)
          await supabase
            .from('pending_referrals')
            .update({ status: 'completed' })
            .eq('id', pending.id)
          processed++
          continue
        }

        // Create the referral
        const { error: referralError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: referrer.id,
            referred_id: referredUser.id,
            status: 'active',
            commission_rate: 10
          })

        if (referralError) {
          console.error('❌ Error creating referral:', referralError)
          await supabase
            .from('pending_referrals')
            .update({ status: 'failed' })
            .eq('id', pending.id)
          processed++
          continue
        }

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
        }

        // Create notification for referrer
        await supabase
          .from('notifications')
          .insert({
            user_id: referrer.id,
            title: '🎉 إحالة متأخرة!',
            message: `لقد حصلت على 100 رمز مقابل إحالة ${pending.first_name || pending.telegram_username || 'مستخدم جديد'}`,
            type: 'success'
          })

        // Mark as completed
        await supabase
          .from('pending_referrals')
          .update({ status: 'completed' })
          .eq('id', pending.id)

        console.log(`🎉 Pending referral processed successfully`)
        processed++
        successful++

      } catch (error) {
        console.error(`❌ Error processing pending referral ${pending.id}:`, error)
        
        // Mark as failed or retry based on error
        await supabase
          .from('pending_referrals')
          .update({ 
            status: pending.retry_count >= 4 ? 'failed' : 'pending',
            retry_count: pending.retry_count + 1
          })
          .eq('id', pending.id)
        
        processed++
      }
    }

    console.log(`✅ Processed ${processed} pending referrals, ${successful} successful`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        successful,
        message: `Processed ${processed} pending referrals, ${successful} successful`
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