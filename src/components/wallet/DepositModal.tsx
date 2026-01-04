import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { ArrowDownLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';
import { TonIcon } from '@/components/ui/currency-icons';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount < 0.1) {
      toast.error('الحد الأدنى للإيداع 0.1 TON');
      return;
    }

    if (!wallet?.account) {
      toast.error('يرجى ربط المحفظة أولاً');
      return;
    }

    setIsProcessing(true);

    try {
      // Create deposit record first
      const { data: depositRecord, error: insertError } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: userId,
          currency: 'TON',
          amount: depositAmount,
          status: 'pending',
          wallet_address: wallet.account.address
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create deposit record:', insertError);
        throw new Error('فشل إنشاء طلب الإيداع');
      }

      // Send TON transaction via TON Connect
      const amountNano = tonToNano(depositAmount);

      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: TON_PAYMENT_ADDRESS,
            amount: amountNano
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);

      if (result) {
        // Update deposit with tx hash
        await supabase
          .from('deposit_requests')
          .update({
            tx_hash: result.boc,
            status: 'pending'
          })
          .eq('id', depositRecord.id);

        // Wait for verification
        toast.info('جاري التحقق من المعاملة...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verify the deposit
        const verifyResult = await supabase.functions.invoke('verify-ton-payment', {
          body: {
            paymentId: depositRecord.id,
            txHash: result.boc,
            walletAddress: wallet.account.address
          }
        });

        if (verifyResult.data?.ok) {
          // Update deposit to confirmed
          await supabase
            .from('deposit_requests')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString()
            })
            .eq('id', depositRecord.id);

          // Add balance to user - get current balance first then update
          const { data: currentUser } = await supabase
            .from('bolt_users')
            .select('ton_balance')
            .eq('id', userId)
            .single();

          if (currentUser) {
            await supabase
              .from('bolt_users')
              .update({
                ton_balance: (currentUser.ton_balance || 0) + depositAmount
              })
              .eq('id', userId);
          }

          setSuccess(true);
          toast.success('تم الإيداع بنجاح! 🎉');
          onSuccess?.();
          
          setTimeout(() => {
            setSuccess(false);
            setAmount('');
            onClose();
          }, 2000);
        } else {
          toast.warning('تم الإرسال! التحقق قد يستغرق دقائق.');
        }
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      if (error.message?.includes('cancelled') || error.message?.includes('declined')) {
        toast.error('تم إلغاء المعاملة');
      } else {
        toast.error('فشل الإيداع');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [0.5, 1, 2, 5];

  return (
    <Dialog open={open} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-xl bg-primary/10">
              <ArrowDownLeft className="w-5 h-5 text-primary" />
            </div>
            إيداع TON
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">تم الإيداع بنجاح!</p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {/* Currency Display */}
            <div className="flex items-center justify-center gap-3 py-4">
              <TonIcon size={48} />
              <span className="text-2xl font-bold text-foreground">TON</span>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">المبلغ</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-2xl text-center font-bold bg-background border-border"
                min="0.1"
                step="0.1"
              />
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(qa.toString())}
                  className="border-border hover:bg-primary/10 hover:border-primary"
                >
                  {qa} TON
                </Button>
              ))}
            </div>

            {/* Min Deposit Notice */}
            <p className="text-xs text-center text-muted-foreground">
              الحد الأدنى للإيداع: 0.1 TON
            </p>

            {/* Deposit Button */}
            <Button
              onClick={handleDeposit}
              disabled={isProcessing || !amount || parseFloat(amount) < 0.1}
              className="w-full h-12 bg-primary hover:bg-primary/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  إيداع {amount ? `${amount} TON` : ''}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
