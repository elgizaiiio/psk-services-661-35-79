import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Server, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RequireServerModalProps {
  open: boolean;
  onClose: () => void;
}

const RequireServerModal: React.FC<RequireServerModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleBuyServer = () => {
    onClose();
    navigate('/mining-servers');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-foreground">Withdrawal Requirement</span>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
            <Server className="w-8 h-8 text-orange-500" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Server Required</h3>
            <p className="text-sm text-muted-foreground">
              To withdraw your earnings, you need to purchase at least one mining server.
            </p>
          </div>

          <Button
            onClick={handleBuyServer}
            className="w-full h-12 bg-primary hover:bg-primary/90"
          >
            Buy Server Now
          </Button>
          
          <button 
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe Later
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default RequireServerModal;
