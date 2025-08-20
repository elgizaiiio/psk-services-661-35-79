import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface PaymentStatusIndicatorProps {
  status: 'pending' | 'confirmed' | 'failed';
  className?: string;
}

const PaymentStatusIndicator: React.FC<PaymentStatusIndicatorProps> = ({
  status,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle,
          text: 'Confirmed',
          className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
        };
      case 'failed':
        return {
          icon: XCircle,
          text: 'Failed',
          className: 'bg-red-500/10 text-red-600 border-red-500/30'
        };
      default:
        return {
          icon: Clock,
          text: 'Pending',
          className: 'bg-orange-500/10 text-orange-600 border-orange-500/30'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className}`}
    >
      <StatusIcon className="w-3 h-3 mr-1" />
      {config.text}
    </Badge>
  );
};

export default PaymentStatusIndicator;