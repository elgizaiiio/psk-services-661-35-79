import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, CheckCircle, Loader2, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SubscribeChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  channelUrl: string;
  channelName: string;
  isChecking: boolean;
  onCheckSubscription: () => Promise<boolean>;
}

const SubscribeChannelModal: React.FC<SubscribeChannelModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  channelUrl,
  channelName,
  isChecking,
  onCheckSubscription
}) => {
  const [checkFailed, setCheckFailed] = useState(false);

  const handleOpenChannel = () => {
    window.open(channelUrl, '_blank');
  };

  const handleVerify = async () => {
    setCheckFailed(false);
    const isSubscribed = await onCheckSubscription();
    
    if (isSubscribed) {
      onVerified();
      onClose();
    } else {
      setCheckFailed(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Subscribe to Continue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground text-sm">
            Please subscribe to our channel to unlock this feature and get the latest updates.
          </p>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <p className="font-medium text-foreground">{channelName}</p>
            <p className="text-xs text-muted-foreground mt-1">Telegram Channel</p>
          </div>

          <Button
            onClick={handleOpenChannel}
            className="w-full gap-2"
            size="lg"
          >
            <ExternalLink className="w-4 h-4" />
            Subscribe to Channel
          </Button>

          <Button
            onClick={handleVerify}
            variant="outline"
            className="w-full gap-2"
            size="lg"
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            I've Subscribed - Verify
          </Button>

          <AnimatePresence>
            {checkFailed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center"
              >
                <p className="text-sm text-destructive">
                  Subscription not found. Please subscribe first and try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscribeChannelModal;
