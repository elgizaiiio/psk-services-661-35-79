import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, Zap, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RequireServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequireServerModal: React.FC<RequireServerModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleGoToServers = () => {
    onClose();
    navigate('/boost');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-gradient-to-br from-card to-card/95 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            مطلوب سيرفر للسحب
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center"
          >
            <Server className="w-10 h-10 text-primary" />
          </motion.div>

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              للسحب من محفظتك، يجب أن تمتلك سيرفر تعدين واحد على الأقل
            </p>
            <p className="text-sm text-muted-foreground/70">
              اشترِ سيرفر الآن لفتح ميزة السحب وزيادة أرباحك!
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoToServers}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80"
            >
              <Zap className="w-4 h-4 mr-2" />
              اشترِ سيرفر الآن
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full"
            >
              لاحقاً
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequireServerModal;
