import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUpRight } from 'lucide-react';
import { TonIcon, UsdtIcon } from '@/components/ui/currency-icons';

interface WithdrawSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCurrency: (currency: 'TON' | 'USDT') => void;
  tonBalance: number;
  usdtBalance: number;
}

const WithdrawSelectModal: React.FC<WithdrawSelectModalProps> = ({
  open,
  onClose,
  onSelectCurrency,
  tonBalance,
  usdtBalance,
}) => {
  const currencies = [
    { 
      id: 'TON' as const, 
      name: 'TON', 
      balance: tonBalance, 
      icon: <TonIcon size={40} />,
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
    },
    { 
      id: 'USDT' as const, 
      name: 'USDT', 
      balance: usdtBalance, 
      icon: <UsdtIcon size={40} />,
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            Select Currency to Withdraw
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {currencies.map((currency, i) => (
            <motion.button
              key={currency.id}
              onClick={() => onSelectCurrency(currency.id)}
              className={`w-full p-4 rounded-xl bg-gradient-to-r ${currency.color} border-2 ${currency.borderColor} flex items-center justify-between transition-all hover:scale-[1.02]`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.98 }}
              disabled={currency.balance <= 0}
            >
              <div className="flex items-center gap-3">
                {currency.icon}
                <div className="text-left">
                  <p className="font-semibold text-foreground">{currency.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Balance: {currency.balance.toFixed(2)}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}

          <p className="text-xs text-center text-muted-foreground pt-2">
            Note: BOLT tokens cannot be withdrawn at this time
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawSelectModal;
