import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Gift, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FreeProTicket = () => {
  const { user: tgUser, webApp } = useTelegramAuth();
  const { user } = useViralMining(tgUser);
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'already_claimed' | 'error'>('loading');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if running in Telegram
  const isTelegramApp = !!webApp && !!tgUser?.id;

  useEffect(() => {
    const checkAndClaimGift = async () => {
      if (!user?.id) return;

      try {
        // Check if user already claimed this gift
        const { data: existingClaim } = await supabase
          .from('spin_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('wheel_type', 'free_pro_gift')
          .maybeSingle();

        if (existingClaim) {
          setStatus('already_claimed');
          return;
        }

        // Claim the free PRO ticket
        setIsProcessing(true);

        // Get current pro tickets
        const { data: ticketData } = await supabase
          .from('user_spin_tickets')
          .select('pro_tickets_count')
          .eq('user_id', user.id)
          .maybeSingle();

        const currentProTickets = (ticketData as any)?.pro_tickets_count || 0;

        // Add 1 PRO ticket
        await supabase
          .from('user_spin_tickets')
          .upsert({
            user_id: user.id,
            pro_tickets_count: currentProTickets + 1,
          }, { onConflict: 'user_id' });

        // Record the claim to prevent re-use
        await supabase
          .from('spin_history')
          .insert({
            user_id: user.id,
            reward_type: 'free_pro_ticket_gift',
            reward_amount: 1,
            wheel_type: 'free_pro_gift',
          });

        setStatus('success');
        toast.success('🎁 Free PRO Ticket claimed!');
      } catch (error) {
        console.error('Error claiming gift:', error);
        setStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    if (user?.id) {
      checkAndClaimGift();
    }
  }, [user?.id]);

  // Redirect to Telegram if not in app
  if (!isTelegramApp) {
    return (
      <>
        <Helmet>
          <title>Free PRO Ticket | Bolt Mining</title>
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Gift className="w-12 h-12 text-purple-500" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Claim Your Free PRO Ticket!
                </h1>
                <p className="text-muted-foreground">
                  Open this link in Telegram to claim your free PRO spin ticket
                </p>
              </div>

              <Button
                onClick={() => window.location.href = "https://t.me/Boltminingbot/App?startapp=free-pro"}
                size="lg"
                className="w-full gap-2 text-lg py-6 bg-gradient-to-r from-purple-500 to-purple-700"
              >
                Open in Telegram
                <ExternalLink className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Free PRO Ticket | Bolt Mining</title>
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
            {/* Icon based on status */}
            <div className="flex justify-center">
              {status === 'loading' || isProcessing ? (
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                </div>
              ) : status === 'success' ? (
                <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              ) : status === 'already_claimed' ? (
                <div className="w-20 h-20 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Gift className="w-12 h-12 text-amber-500" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-destructive/20 flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
              )}
            </div>

            {/* Content based on status */}
            <div className="space-y-2">
              {status === 'loading' || isProcessing ? (
                <>
                  <h1 className="text-2xl font-bold text-foreground">
                    Claiming Your Gift...
                  </h1>
                  <p className="text-muted-foreground">
                    Please wait while we process your free PRO ticket
                  </p>
                </>
              ) : status === 'success' ? (
                <>
                  <h1 className="text-2xl font-bold text-foreground">
                    🎉 Gift Claimed!
                  </h1>
                  <p className="text-muted-foreground">
                    You've received 1 FREE PRO Spin Ticket! Go to the Spin page to use it.
                  </p>
                </>
              ) : status === 'already_claimed' ? (
                <>
                  <h1 className="text-2xl font-bold text-foreground">
                    Gift Already Used
                  </h1>
                  <p className="text-muted-foreground">
                    You have already claimed this gift. Each user can only claim once.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground">
                    Something Went Wrong
                  </h1>
                  <p className="text-muted-foreground">
                    Failed to claim the gift. Please try again later.
                  </p>
                </>
              )}
            </div>

            {/* Action button */}
            {status === 'success' && (
              <Button
                onClick={() => navigate('/spin')}
                size="lg"
                className="w-full gap-2 text-lg py-6 bg-gradient-to-r from-purple-500 to-purple-700"
              >
                <Gift className="w-5 h-5" />
                Go to Spin
              </Button>
            )}

            {status === 'already_claimed' && (
              <Button
                onClick={() => navigate('/spin')}
                size="lg"
                variant="outline"
                className="w-full gap-2"
              >
                Go to Spin Page
              </Button>
            )}

            {status === 'error' && (
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                variant="outline"
                className="w-full gap-2"
              >
                Try Again
              </Button>
            )}

            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default FreeProTicket;
