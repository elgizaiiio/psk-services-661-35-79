
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Lock, Eye, Zap, Sparkles } from 'lucide-react';

interface DailyCodes {
  code1: string;
  code2: string;
  code3: string;
  code4: string;
}

interface SecretCodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (codes: string[]) => void;
  dailyCodes: DailyCodes | null;
}

export const SecretCodeDialog: React.FC<SecretCodeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  dailyCodes
}) => {
  const [codes, setCodes] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);
  };

  const handleSubmit = async () => {
    if (codes.every(code => code.length === 4)) {
      setIsSubmitting(true);
      try {
        await onSubmit(codes);
        setCodes(['', '', '', '']);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setCodes(['', '', '', '']);
    onClose();
  };

  const isComplete = codes.every(code => code.length === 4);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto bg-card/90 backdrop-blur-lg border-primary/20 shadow-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-lg font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Secret Agent Mission
          </DialogTitle>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-primary" />
              <span>Secrecy Level: Top Secret</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Eye className="w-3 h-3 text-primary" />
              <span>For Selected Agents Only</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Mission Briefing */}
          <div className="p-3 rounded-lg bg-muted/50 border border-primary/20 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-primary" />
              <span className="font-semibold text-xs">Mission Instructions</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the four secret codes to earn 500 points.
            </p>
          </div>

          {/* Code Input Grid */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-primary">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <span className="text-xs font-medium">Secret Code {index + 1}</span>
                </div>
                <InputOTP
                  maxLength={4}
                  value={codes[index]}
                  onChange={(value) => handleCodeChange(index, value)}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="border-primary/30 text-center w-8 h-8 text-sm shadow-sm" />
                    <InputOTPSlot index={1} className="border-primary/30 text-center w-8 h-8 text-sm shadow-sm" />
                    <InputOTPSlot index={2} className="border-primary/30 text-center w-8 h-8 text-sm shadow-sm" />
                    <InputOTPSlot index={3} className="border-primary/30 text-center w-8 h-8 text-sm shadow-sm" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 text-sm shadow-sm hover:shadow-md"
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              variant="glow"
              onClick={handleSubmit}
              disabled={!isComplete || isSubmitting}
              className="flex-1 text-sm shadow-md hover:shadow-lg"
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-3 h-3 border-2 border-background border-t-transparent rounded-full mr-1" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  Confirm
                  <Sparkles className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Security Footer */}
          <div className="text-center text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Protected by AES-256 Encryption</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
