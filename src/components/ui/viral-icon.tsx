import React from 'react';
import { cn } from '@/lib/utils';

interface ViralIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const ViralIcon: React.FC<ViralIconProps> = ({ 
  className, 
  size = 'md', 
  color = 'currentColor' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Geometric V-shaped design based on the provided image */}
      <path
        d="M20 15 L45 70 L50 70 L75 15"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M25 25 L45 70 L55 70 L75 25"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M45 70 L55 70 L65 85 L35 85 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default ViralIcon;