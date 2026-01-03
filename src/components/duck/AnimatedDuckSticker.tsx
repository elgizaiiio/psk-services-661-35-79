import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface AnimatedDuckStickerProps {
  stickerUrl: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
};

export const AnimatedDuckSticker: React.FC<AnimatedDuckStickerProps> = ({
  stickerUrl,
  alt,
  size = 'md',
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {!isLoaded && !hasError && (
        <Skeleton className={`absolute inset-0 rounded-full ${sizeClasses[size]}`} />
      )}
      
      <motion.img
        src={stickerUrl}
        alt={alt}
        className={`${sizeClasses[size]} object-contain ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      />
      
      {hasError && (
        <div className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded-full text-4xl`}>
          🐤
        </div>
      )}
    </div>
  );
};
