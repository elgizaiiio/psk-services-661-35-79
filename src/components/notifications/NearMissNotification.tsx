import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface NearMissNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

const NearMissNotification: React.FC<NearMissNotificationProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleBuyTickets = () => {
    onClose();
    navigate('/spin');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="mx-auto mb-4"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
          <DialogTitle className="text-xl font-bold text-foreground">
            So Close!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            You almost won the jackpot! Your luck is building up. Try again for a better chance!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Button 
            onClick={handleBuyTickets}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NearMissNotification;
