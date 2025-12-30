import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BoltIcon from '@/components/ui/bolt-icon';
import { Sparkles, Zap, Gift, Users } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const WelcomeModal = ({ isOpen, onClose, userName }: WelcomeModalProps) => {
  const [step, setStep] = useState(0);

  const features = [
    {
      icon: Zap,
      title: 'ابدأ التعدين',
      description: 'اربح عملات Bolt كل ساعة بالتعدين المجاني',
      color: 'text-yellow-400',
    },
    {
      icon: Gift,
      title: 'مهام يومية',
      description: 'أكمل المهام واحصل على مكافآت إضافية',
      color: 'text-emerald-400',
    },
    {
      icon: Users,
      title: 'ادعُ أصدقاءك',
      description: 'احصل على 500 عملة لكل صديق ينضم',
      color: 'text-blue-400',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-b from-background to-background/95 p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 text-center"
            >
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
                className="relative mx-auto w-24 h-24 mb-6"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <BoltIcon className="w-12 h-12 text-primary-foreground" />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>

              {/* Welcome Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  مرحباً {userName || 'بك'}! 🎉
                </h2>
                <p className="text-muted-foreground mb-6">
                  أهلاً وسهلاً في Bolt Mining
                  <br />
                  مستقبل التعدين الرقمي يبدأ من هنا
                </p>
              </motion.div>

              {/* Bonus Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Gift className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  🎁 حصلت على 100 عملة ترحيبية!
                </span>
              </motion.div>

              <Button onClick={() => setStep(1)} className="w-full" size="lg">
                التالي
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <h3 className="text-xl font-bold text-center mb-6">
                كيف تبدأ؟
              </h3>

              <div className="space-y-4 mb-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`p-2 rounded-lg bg-background ${feature.color}`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div className="text-right flex-1">
                      <h4 className="font-semibold text-foreground">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button onClick={onClose} className="w-full" size="lg">
                <Zap className="w-4 h-4 mr-2" />
                ابدأ التعدين الآن
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
