import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EventType = 
  | 'user_signup'
  | 'first_mining_complete'
  | 'referral_joined'
  | 'milestone_reached'
  | 'streak_at_risk'
  | 'balance_low'
  | 'vip_upgrade'
  | 'task_completed';

interface TriggerRequest {
  event_type: EventType;
  user_id: string;
  event_data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_type, user_id, event_data }: TriggerRequest = await req.json();

    if (!event_type || !user_id) {
      return new Response(
        JSON.stringify({ error: 'event_type and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Triggering marketing event: ${event_type} for user ${user_id}`);

    // Find matching event-based campaigns
    const { data: campaigns } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('trigger_type', 'event_based')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active event-based campaigns' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter campaigns by event type matching
    const matchingCampaigns = campaigns.filter(campaign => {
      const conditions = campaign.trigger_conditions as Record<string, unknown>;
      
      // Check if campaign handles this event type
      if (conditions?.event_types) {
        return (conditions.event_types as string[]).includes(event_type);
      }
      
      // Match campaign type to event type
      switch (event_type) {
        case 'user_signup':
          return campaign.campaign_type === 'onboarding';
        case 'first_mining_complete':
          return campaign.campaign_type === 'onboarding' || campaign.campaign_type === 'milestone';
        case 'referral_joined':
          return campaign.campaign_type === 'referral_boost';
        case 'milestone_reached':
          return campaign.campaign_type === 'milestone';
        case 'streak_at_risk':
        case 'balance_low':
          return campaign.campaign_type === 're_engagement';
        case 'vip_upgrade':
          return campaign.campaign_type === 'vip';
        default:
          return false;
      }
    });

    if (matchingCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No matching campaigns for this event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call auto-marketing function for each matching campaign
    const results = await Promise.all(
      matchingCampaigns.map(async (campaign) => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/auto-marketing`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campaign_id: campaign.id,
              event_type,
              user_id,
            }),
          });

          const result = await response.json();
          return { campaign_id: campaign.id, campaign_name: campaign.name, ...result };
        } catch (error) {
          console.error(`Failed to trigger campaign ${campaign.id}:`, error);
          return { campaign_id: campaign.id, error: String(error) };
        }
      })
    );

    // Store the event for analytics
    await supabase.from('marketing_events').insert({
      user_id,
      event_type,
      event_data: event_data || {},
      delivery_status: 'triggered',
    });

    return new Response(
      JSON.stringify({
        success: true,
        event_type,
        campaigns_triggered: matchingCampaigns.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trigger marketing event error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to trigger marketing event', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
