import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReferralMilestones, ReferralMilestone } from '@/hooks/useReferralMilestones';
import { Users, Check, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TonIcon, UsdtIcon } from '@/components/ui/currency-icons';
import { AnimatedProgress } from '@/components/ui/motion-wrapper';

interface ReferralMilestonesSectionProps {
  userId: string | undefined;
}

const MilestoneCard: React.FC<{
  milestone: ReferralMilestone;
  onClaim: (type: 'invite_3' | 'invite_10') => Promise<boolean>;
}> = ({ milestone, onClaim }) => {
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (claiming || !milestone.completed || milestone.claimed) return;

    setClaiming(true);
    const success = await onClaim(milestone.type);
    if (success) {
      toast.success(`${milestone.rewardAmount} ${milestone.rewardCurrency} added to your balance!`);
    } else {
      toast.error('Failed to claim reward');
    }
    setClaiming(false);
  };

  const progressPercent = (milestone.progress / milestone.requiredReferrals) * 100;

  return (
    <motion.div
      className={`p-4 rounded-xl border transition-all ${
        milestone.claimed
          ? 'bg-green-500/10 border-green-500/30'
          : milestone.completed
          ? 'bg-primary/10 border-primary/30'
          : 'bg-card border-border'
      }`}
      whileTap={milestone.completed && !milestone.claimed ? { scale: 0.98 } : undefined}
      onClick={handleClaim}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            milestone.claimed
              ? 'bg-green-500/20'
              : milestone.completed
              ? 'bg-primary/20'
              : 'bg-muted'
          }`}
        >
          {milestone.claimed ? (
            <Check className="w-6 h-6 text-green-500" />
          ) : (
            <Users className={`w-6 h-6 ${milestone.completed ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">
            Invite {milestone.requiredReferrals} Friends
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <span>Reward:</span>
            <span className="font-semibold text-foreground">{milestone.rewardAmount}</span>
            {milestone.rewardCurrency === 'TON' ? (
              <TonIcon size={12} />
            ) : (
              <UsdtIcon size={12} />
            )}
            <span>{milestone.rewardCurrency}</span>
          </div>
          {!milestone.claimed && (
            <div className="mt-2">
              <AnimatedProgress value={progressPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {milestone.progress}/{milestone.requiredReferrals} friends
              </p>
            </div>
          )}
        </div>

        {/* Action */}
        {milestone.claimed ? (
          <div className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-500 text-xs font-medium">
            Claimed
          </div>
        ) : milestone.completed ? (
          <button
            disabled={claiming}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1"
          >
            {claiming ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Gift className="w-3 h-3" />
                Claim
              </>
            )}
          </button>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
            {milestone.requiredReferrals - milestone.progress} more
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ReferralMilestonesSection: React.FC<ReferralMilestonesSectionProps> = ({ userId }) => {
  const { milestones, loading, totalReferrals, claimMilestone } = useReferralMilestones(userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Referral Milestones</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalReferrals} friends invited
        </span>
      </div>

      {milestones.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          onClaim={claimMilestone}
        />
      ))}
    </div>
  );
};

export default ReferralMilestonesSection;
