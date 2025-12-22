import React from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface BoltIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BoltIcon: React.FC<BoltIconProps> = ({ 
  className, 
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <Zap 
      className={cn(sizeClasses[size], 'text-primary fill-primary', className)} 
    />
  );
};

export default BoltIcon;
