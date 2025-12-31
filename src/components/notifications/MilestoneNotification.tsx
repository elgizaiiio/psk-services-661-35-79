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
import { Target, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MilestoneNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const MilestoneNotification: React.FC<MilestoneNotificationProps> = ({ 
  isOpen, 
  onClose,
  message = "You're almost at the next level! A small boost can get you there."
}) => {
  const navigate = useNavigate();

  const handleBoost = () => {
    onClose();
    navigate('/buy-bolt');
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <Target className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-xl font-bold text-foreground">
            Almost There!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="my-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">85% complete</p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleBoost}
            className="w-full gap-2"
          >
            <Zap className="w-4 h-4" />
            Get a Boost
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Keep Going
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneNotification;
