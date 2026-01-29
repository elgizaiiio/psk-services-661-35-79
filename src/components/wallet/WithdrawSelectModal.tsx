import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowUpRight, X } from 'lucide-react';
import { TonIcon, UsdtIcon, ViralIcon } from '@/components/ui/currency-icons';

interface WithdrawSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCurrency: (currency: 'TON' | 'USDT' | 'VIRAL') => void;
  tonBalance: number;
  usdtBalance: number;
  viralBalance?: number;
}

const WithdrawSelectModal: React.FC<WithdrawSelectModalProps> = ({
  open,
  onClose,
  onSelectCurrency,
  tonBalance,
  usdtBalance,
  viralBalance = 0,
}) => {
  const currencies = [
    { 
      id: 'VIRAL' as const, 
      name: 'VIRAL', 
      fullName: 'Viral Token',
      balance: viralBalance, 
      icon: <ViralIcon size={36} />,
      minWithdraw: 100,
      isInstant: true,
    },
    { 
      id: 'TON' as const, 
      name: 'TON', 
      fullName: 'Toncoin',
      balance: tonBalance, 
      icon: <TonIcon size={36} />,
      minWithdraw: 1,
      isInstant: false,
    },
    { 
      id: 'USDT' as const, 
      name: 'USDT', 
      fullName: 'Tether USD',
      balance: usdtBalance, 
      icon: <UsdtIcon size={36} />,
      minWithdraw: 5,
      isInstant: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-orange-500" />
            </div>
            <span className="font-semibold text-foreground">Select Currency</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency List */}
        <div className="p-4 space-y-2">
          {currencies.map((currency) => (
            <button
              key={currency.id}
              onClick={() => currency.balance >= currency.minWithdraw && onSelectCurrency(currency.id)}
              disabled={currency.balance < currency.minWithdraw}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                {currency.icon}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{currency.name}</p>
                    {currency.isInstant && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-500 rounded">
                        Instant
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{currency.fullName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">{currency.balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Min: {currency.minWithdraw}</p>
              </div>
            </button>
          ))}

          <p className="text-xs text-center text-muted-foreground pt-3">
            BOLT tokens cannot be withdrawn at this time
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawSelectModal;
