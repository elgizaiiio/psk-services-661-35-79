import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FreeProTicket = () => {
  const { user: tgUser, webApp } = useTelegramAuth();
  const { user } = useViralMining(tgUser);
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already_claimed' | 'error'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if running in Telegram
  const isTelegramApp = !!webApp && !!tgUser?.id;

  // Check if user already claimed
  useEffect(() => {
    const checkClaimed = async () => {
      if (!user?.id) return;

      try {
        const { data: existingClaim } = await supabase
          .from('spin_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('wheel_type', 'free_pro_gift')
          .maybeSingle();

        if (existingClaim) {
          setStatus('already_claimed');
        }
      } catch (error) {
        console.error('Error checking claim:', error);
      }
    };

    if (user?.id && isTelegramApp) {
      checkClaimed();
    }
  }, [user?.id, isTelegramApp]);

  const handleClaimGift = async () => {
    if (!user?.id || isProcessing) return;

    setIsProcessing(true);
    setStatus('loading');

    try {
      // Double check if already claimed
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
      toast.success('Gift claimed successfully!');
    } catch (error) {
      console.error('Error claiming gift:', error);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect to Telegram if not in app
  if (!isTelegramApp) {
    return (
      <>
        <Helmet>
          <title>Free PRO Ticket | Bolt Mining</title>
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-border/50 bg-card/80 backdrop-blur-sm rounded-xl p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">PRO</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Free PRO Ticket
              </h1>
              <p className="text-muted-foreground">
                Open this link in Telegram to claim your free PRO spin ticket
              </p>
            </div>

            <Button
              onClick={() => window.location.href = "https://t.me/Boltminingbot/App?startapp=free-pro"}
              size="lg"
              className="w-full text-lg py-6"
            >
              Open in Telegram
            </Button>
          </div>
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
        <div className="w-full max-w-md border border-border/50 bg-card/80 backdrop-blur-sm rounded-xl p-8 text-center space-y-6">
          {/* Header */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">PRO</span>
            </div>
          </div>

          {/* Content based on status */}
          <div className="space-y-2">
            {status === 'idle' && (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  Free PRO Ticket
                </h1>
                <p className="text-muted-foreground">
                  Claim your free PRO spin ticket. One gift per user.
                </p>
              </>
            )}
            {status === 'loading' && (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  Processing...
                </h1>
                <p className="text-muted-foreground">
                  Please wait while we process your gift
                </p>
              </>
            )}
            {status === 'success' && (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  Gift Claimed
                </h1>
                <p className="text-muted-foreground">
                  You received 1 FREE PRO Spin Ticket. Go to the Spin page to use it.
                </p>
              </>
            )}
            {status === 'already_claimed' && (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  Gift Already Used
                </h1>
                <p className="text-muted-foreground">
                  You have already claimed this gift. Each user can only claim once.
                </p>
              </>
            )}
            {status === 'error' && (
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

          {/* Action buttons */}
          {status === 'idle' && (
            <Button
              onClick={handleClaimGift}
              disabled={isProcessing}
              size="lg"
              className="w-full text-lg py-6"
            >
              Claim Gift
            </Button>
          )}

          {status === 'success' && (
            <Button
              onClick={() => navigate('/spin')}
              size="lg"
              className="w-full text-lg py-6"
            >
              Go to Spin
            </Button>
          )}

          {status === 'already_claimed' && (
            <Button
              onClick={() => navigate('/spin')}
              size="lg"
              variant="outline"
              className="w-full"
            >
              Go to Spin Page
            </Button>
          )}

          {status === 'error' && (
            <Button
              onClick={() => {
                setStatus('idle');
              }}
              size="lg"
              variant="outline"
              className="w-full"
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
        </div>
      </div>
    </>
  );
};

export default FreeProTicket;