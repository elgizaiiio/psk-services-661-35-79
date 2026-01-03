import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Send, 
  Users, 
  BarChart3, 
  Plus, 
  Trash2, 
  Play,
  Pause,
  Megaphone,
  Target,
  TrendingUp
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  campaign_type: string;
  trigger_type: string;
  target_segment: string;
  ai_prompt_context: string | null;
  message_template: string | null;
  is_active: boolean;
  priority: number;
  cooldown_hours: number;
  created_at: string;
}

interface Segment {
  id: string;
  name: string;
  segment_key: string;
  description: string | null;
  user_count: number;
  is_active: boolean;
}

interface Analytics {
  campaign_id: string;
  date: string;
  messages_sent: number;
  messages_delivered: number;
  messages_opened: number;
  conversions: number;
}

export default function AdminMarketing() {
  const queryClient = useQueryClient();
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    campaign_type: "general",
    trigger_type: "scheduled",
    target_segment: "all",
    ai_prompt_context: "",
    priority: 5,
    cooldown_hours: 24,
  });

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('priority', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  // Fetch segments
  const { data: segments } = useQuery({
    queryKey: ['user-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_segments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Segment[];
    },
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['campaign-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Analytics[];
    },
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .insert(campaign);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast.success('Campaign created successfully');
      setNewCampaign({
        name: "",
        campaign_type: "general",
        trigger_type: "scheduled",
        target_segment: "all",
        ai_prompt_context: "",
        priority: 5,
        cooldown_hours: 24,
      });
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + error.message);
    },
  });

  // Toggle campaign active status
  const toggleCampaign = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast.success('Campaign updated');
    },
  });

  // Run campaign manually
  const runCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('auto-marketing', {
        body: { campaign_id: campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Campaign sent: ${data.total_delivered} messages delivered`);
      queryClient.invalidateQueries({ queryKey: ['campaign-analytics'] });
    },
    onError: (error) => {
      toast.error('Failed to run campaign: ' + error.message);
    },
  });

  // Delete campaign
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast.success('Campaign deleted');
    },
  });

  // Calculate totals
  const totalSent = analytics?.reduce((sum, a) => sum + a.messages_sent, 0) || 0;
  const totalDelivered = analytics?.reduce((sum, a) => sum + a.messages_delivered, 0) || 0;
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-muted-foreground">Campaigns</span>
            </div>
            <p className="text-2xl font-bold mt-2">{campaigns?.length || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-400" />
              <span className="text-sm text-muted-foreground">Messages Sent</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-muted-foreground">Delivered</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalDelivered.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-muted-foreground">Delivery Rate</span>
            </div>
            <p className="text-2xl font-bold mt-2">{deliveryRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Create Campaign Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Campaign Name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
                <Select
                  value={newCampaign.campaign_type}
                  onValueChange={(v) => setNewCampaign({ ...newCampaign, campaign_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Campaign Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="re_engagement">Re-engagement</SelectItem>
                    <SelectItem value="referral_boost">Referral Boost</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="daily">Daily Reminder</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={newCampaign.trigger_type}
                  onValueChange={(v) => setNewCampaign({ ...newCampaign, trigger_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trigger Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="event_based">Event Based</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={newCampaign.target_segment}
                  onValueChange={(v) => setNewCampaign({ ...newCampaign, target_segment: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Target Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments?.map((segment) => (
                      <SelectItem key={segment.id} value={segment.segment_key}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="AI Prompt Context - Describe what kind of message to generate"
                value={newCampaign.ai_prompt_context}
                onChange={(e) => setNewCampaign({ ...newCampaign, ai_prompt_context: e.target.value })}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Priority (1-10)"
                  value={newCampaign.priority}
                  onChange={(e) => setNewCampaign({ ...newCampaign, priority: parseInt(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Cooldown Hours"
                  value={newCampaign.cooldown_hours}
                  onChange={(e) => setNewCampaign({ ...newCampaign, cooldown_hours: parseInt(e.target.value) })}
                />
              </div>

              <Button
                onClick={() => createCampaign.mutate(newCampaign)}
                disabled={!newCampaign.name || createCampaign.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>

          {/* Campaign List */}
          <div className="space-y-3">
            {campaignsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              campaigns?.map((campaign) => (
                <Card key={campaign.id} className={campaign.is_active ? '' : 'opacity-60'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <Badge variant={campaign.is_active ? "default" : "secondary"}>
                            {campaign.campaign_type}
                          </Badge>
                          <Badge variant="outline">{campaign.trigger_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Target: {campaign.target_segment} | Priority: {campaign.priority} | Cooldown: {campaign.cooldown_hours}h
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={campaign.is_active}
                          onCheckedChange={(checked) => 
                            toggleCampaign.mutate({ id: campaign.id, is_active: checked })
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runCampaign.mutate(campaign.id)}
                          disabled={!campaign.is_active || runCampaign.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCampaign.mutate(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments?.map((segment) => (
              <Card key={segment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{segment.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {segment.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Key: {segment.segment_key}
                      </p>
                    </div>
                    <Badge variant={segment.is_active ? "default" : "secondary"}>
                      {segment.user_count} users
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics && analytics.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-right p-2">Sent</th>
                          <th className="text-right p-2">Delivered</th>
                          <th className="text-right p-2">Opened</th>
                          <th className="text-right p-2">Conversions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-b border-border/50">
                            <td className="p-2">{new Date(row.date).toLocaleDateString()}</td>
                            <td className="text-right p-2">{row.messages_sent}</td>
                            <td className="text-right p-2">{row.messages_delivered}</td>
                            <td className="text-right p-2">{row.messages_opened}</td>
                            <td className="text-right p-2">{row.conversions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No analytics data yet. Run campaigns to see results.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
