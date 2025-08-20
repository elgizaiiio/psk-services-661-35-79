import { useState } from 'react';
import { toast } from 'sonner';
import { useDirectTonPayment } from './useDirectTonPayment';

export interface MiningUpgradeParams {
  upgradeType: 'power' | 'duration';
  currentValue: number;
  tonAmount: number;
  userId: string;
}

export const useMiningUpgrades = () => {
  const [isUpgrading, setIsUpgrading] = useState<'power' | 'duration' | null>(null);
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();

  const createMiningUpgradePayment = async (params: MiningUpgradeParams) => {
    setIsUpgrading(params.upgradeType);
    
    try {
      const success = await sendDirectPayment({
        amount: params.tonAmount,
        description: `Mining ${params.upgradeType} upgrade`,
        productType: 'mining_upgrade',
        upgradeType: params.upgradeType
      });

      if (success) {
        const paymentRecord = {
          id: `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: params.userId,
          amount_ton: params.tonAmount,
          description: `Mining ${params.upgradeType} upgrade`,
          product_type: 'mining_upgrade',
          status: 'confirmed',
          upgrade_type: params.upgradeType,
          current_value: params.currentValue,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem(`mining_upgrade_${paymentRecord.id}`, JSON.stringify(paymentRecord));
        toast.success(`${params.upgradeType === 'power' ? 'Power' : 'Duration'} upgrade purchased successfully! 🎉`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Mining upgrade payment failed:', error);
      toast.error('Failed to purchase upgrade');
      return false;
    } finally {
      setIsUpgrading(null);
    }
  };

  return {
    createMiningUpgradePayment,
    isUpgrading,
    isProcessing
  };
};