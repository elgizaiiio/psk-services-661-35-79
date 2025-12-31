import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Clock, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

interface DecliningOfferNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

const DecliningOfferNotification: React.FC<DecliningOfferNotificationProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClaim = () => {
    onClose();
    navigate('/vip');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="mx-auto mb-4"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <Percent className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
          
          <DialogTitle className="text-xl font-bold text-foreground">
            Special Welcome Offer!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Get 50% OFF your first VIP subscription. This offer is only available for new members!
          </DialogDescription>
        </DialogHeader>

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-2 py-4 px-4 bg-muted/50 rounded-xl my-4">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Expires in:</span>
          <span className="text-lg font-bold text-primary font-mono">{formatTime(timeLeft)}</span>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleClaim}
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            <Crown className="w-4 h-4" />
            Claim 50% OFF
          </Button>
          <Button 
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground"
          >
            No Thanks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecliningOfferNotification;
