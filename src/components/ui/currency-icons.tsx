import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyIconProps {
  className?: string;
  size?: number;
}

export const TonIcon: React.FC<CurrencyIconProps> = ({ className, size = 20 }) => (
  <img 
    src="/images/currency/ton.png" 
    alt="TON" 
    className={cn("inline-block", className)}
    style={{ width: size, height: size }}
  />
);

export const UsdtIcon: React.FC<CurrencyIconProps> = ({ className, size = 20 }) => (
  <img 
    src="/images/currency/usdt.svg" 
    alt="USDT" 
    className={cn("inline-block", className)}
    style={{ width: size, height: size }}
  />
);

export const BoltIcon: React.FC<CurrencyIconProps> = ({ className, size = 20 }) => (
  <div 
    className={cn("inline-flex items-center justify-center rounded-full bg-black", className)}
    style={{ width: size, height: size }}
  >
    <Zap 
      className="text-yellow-400 fill-yellow-400" 
      style={{ width: size * 0.6, height: size * 0.6 }}
    />
  </div>
);

export const ViralIcon: React.FC<CurrencyIconProps> = ({ className, size = 20 }) => (
  <div 
    className={cn("inline-flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500", className)}
    style={{ width: size, height: size }}
  >
    <span 
      className="text-white font-bold"
      style={{ fontSize: size * 0.5 }}
    >
      V
    </span>
  </div>
);

export const EthIcon: React.FC<CurrencyIconProps> = ({ className, size = 20 }) => (
  <img 
    src="https://www.joinhu4.io/checkout/_next/static/media/eth.8e5a63b6.svg" 
    alt="ETH" 
    className={cn("inline-block", className)}
    style={{ width: size, height: size }}
  />
);
