import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Gift, Sparkles, Zap, Coins, Crown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

interface LuckyBox {
  id: string;
  name: string;
  rarity: string;
  possible_rewards: any[];
  price_ton: number;
  win_chance: number;
}

interface LuckySpinModalProps {
  userId: string;
  onReward?: (reward: any) => void;
}

const RARITY_COLORS = {
  common: 'from-gray-500/30 to-gray-600/30 border-gray-500/50',
  rare: 'from-blue-500/30 to-cyan-500/30 border-blue-500/50',
  epic: 'from-purple-500/30 to-pink-500/30 border-purple-500/50',
  legendary: 'from-yellow-500/30 to-orange-500/30 border-yellow-500/50'
};

const RARITY_TEXT = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400'
};

export const LuckySpinModal = ({ userId, onReward }: LuckySpinModalProps) => {
  const [boxes, setBoxes] = useState<LuckyBox[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [selectedBox, setSelectedBox] = useState<LuckyBox | null>(null);
  const [dailySpinAvailable, setDailySpinAvailable] = useState(true);
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    loadBoxes();
    checkDailySpin();
  }, [userId]);

  const loadBoxes = async () => {
    try {
      const { data } = await supabase
        .from('bolt_lucky_boxes' as any)
        .select('*')
        .eq('is_active', true)
        .order('price_ton', { ascending: true });

      if (data) {
        setBoxes(data as unknown as LuckyBox[]);
      }
    } catch (error) {
      console.error('Error loading boxes:', error);
    }
  };

  const checkDailySpin = () => {
    const lastSpin = localStorage.getItem(`daily_spin_${userId}`);
    if (lastSpin) {
      const lastSpinDate = new Date(lastSpin);
      const today = new Date();
      setDailySpinAvailable(
        lastSpinDate.toDateString() !== today.toDateString()
      );
    }
  };

  const spinBox = async (box: LuckyBox, isFree: boolean = false) => {
    setSelectedBox(box);
    setIsSpinning(true);
    setReward(null);

    try {
      let paymentVerified = isFree;

      if (!isFree) {
        // Create payment record FIRST with pending status
        const { data: paymentData, error: paymentError } = await supabase
          .from('ton_payments')
          .insert({
            user_id: userId,
            amount_ton: box.price_ton,
            description: `Lucky Box: ${box.name}`,
            product_type: 'game_powerup',
            product_id: box.id,
            destination_address: TON_PAYMENT_ADDRESS,
            status: 'pending',
          })
          .select()
          .single();

        if (paymentError) {
          toast.error('Failed to create payment record');
          setIsSpinning(false);
          return;
        }

        const transaction = {
          validUntil: getValidUntil(),
          messages: [{
            address: TON_PAYMENT_ADDRESS,
            amount: tonToNano(box.price_ton)
          }]
        };
        
        const result = await tonConnectUI.sendTransaction(transaction);

        if (result?.boc) {
          // Save tx_hash but keep as PENDING
          await supabase
            .from('ton_payments')
            .update({ 
              tx_hash: result.boc,
              status: 'pending'
            })
            .eq('id', paymentData.id);

          toast.info('Verifying transaction on blockchain...');

          // Wait for blockchain confirmation
          await new Promise(resolve => setTimeout(resolve, 6000));

          // Call verify-ton-payment to confirm
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-ton-payment', {
            body: {
              paymentId: paymentData.id,
              txHash: result.boc,
            },
            headers: {
              'x-telegram-id': userId,
            }
          });

          if (verifyError || verifyData?.status !== 'confirmed') {
            toast.warning('Payment pending verification. Rewards will be applied once confirmed.');
            setIsSpinning(false);
            return;
          }

          // Update to confirmed
          await supabase
            .from('ton_payments')
            .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
            .eq('id', paymentData.id);

          paymentVerified = true;
        } else {
          setIsSpinning(false);
          return;
        }
      }

      if (!paymentVerified) {
        setIsSpinning(false);
        return;
      }

      // Simulate spinning animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Determine reward based on win chance
      const won = Math.random() * 100 < box.win_chance;
      const rewards = box.possible_rewards || [];
      
      if (won && rewards.length > 0) {
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        setReward(randomReward);

        // Apply reward
        if (randomReward.type === 'tokens') {
          const { data: userData } = await supabase
            .from('bolt_users')
            .select('token_balance')
            .eq('id', userId)
            .single();

          if (userData) {
            await supabase
              .from('bolt_users')
              .update({ token_balance: (userData.token_balance || 0) + randomReward.amount })
              .eq('id', userId);
          }
          toast.success(`🎉 You won ${randomReward.amount} VIRAL tokens!`);
        } else {
          toast.success(`🎉 You won ${randomReward.type}!`);
        }

        onReward?.(randomReward);
      } else {
        setReward({ type: 'consolation', amount: 5 });
        toast.info('Better luck next time! +5 VIRAL as consolation');
      }

      if (isFree) {
        localStorage.setItem(`daily_spin_${userId}`, new Date().toISOString());
        setDailySpinAvailable(false);
      }

      // Add social notification
      await supabase.from('bolt_social_notifications' as any).insert({
        user_id: userId,
        username: 'Someone',
        action_type: 'lucky_box',
        product_name: box.name
      });

    } catch (error) {
      console.error('Error spinning:', error);
      toast.error('Transaction failed or cancelled');
    } finally {
      setIsSpinning(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'tokens': return Coins;
      case 'power_boost': return Zap;
      case 'vip_day':
      case 'vip_week': return Crown;
      default: return Star;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 hover:from-yellow-500/30 hover:to-orange-500/30"
        >
          <Gift className="w-4 h-4 mr-2" />
          Lucky Boxes
          {dailySpinAvailable && (
            <Badge className="ml-2 bg-green-500 text-white text-xs">FREE</Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-lg border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Lucky Boxes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Daily free spin */}
          {dailySpinAvailable && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-green-400">🎁 Daily Free Spin!</h4>
                  <p className="text-sm text-muted-foreground">Try your luck for free once a day</p>
                </div>
                <Button 
                  onClick={() => boxes[0] && spinBox(boxes[0], true)}
                  disabled={isSpinning}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Spin Free!
                </Button>
              </div>
            </motion.div>
          )}

          {/* Box selection */}
          <div className="grid grid-cols-2 gap-3">
            {boxes.map(box => (
              <motion.div
                key={box.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`p-3 bg-gradient-to-br ${RARITY_COLORS[box.rarity as keyof typeof RARITY_COLORS]} cursor-pointer transition-all hover:shadow-lg`}
                  onClick={() => !isSpinning && spinBox(box)}
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-3xl mb-2"
                    >
                      {box.rarity === 'legendary' ? '💎' : 
                       box.rarity === 'epic' ? '🎁' :
                       box.rarity === 'rare' ? '📦' : '🎲'}
                    </motion.div>
                    <h4 className={`font-bold ${RARITY_TEXT[box.rarity as keyof typeof RARITY_TEXT]}`}>
                      {box.name}
                    </h4>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {box.win_chance}% win rate
                    </Badge>
                    <p className="text-lg font-bold mt-2">{box.price_ton} TON</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Spinning animation */}
          <AnimatePresence>
            {isSpinning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              >
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { repeat: Infinity, duration: 0.5 },
                    scale: { repeat: Infinity, duration: 0.5 }
                  }}
                  className="text-8xl"
                >
                  🎰
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reward display */}
          <AnimatePresence>
            {reward && !isSpinning && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="p-4 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-500/50 rounded-lg text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: 3, duration: 0.3 }}
                  className="text-4xl mb-2"
                >
                  🎉
                </motion.div>
                <h4 className="font-bold text-xl text-yellow-400">
                  {reward.type === 'tokens' ? `+${reward.amount} VIRAL!` :
                   reward.type === 'consolation' ? '+5 VIRAL (Consolation)' :
                   `Won: ${reward.type}!`}
                </h4>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
