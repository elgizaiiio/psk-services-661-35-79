import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface AnimatedDuckStickerProps {
  stickerUrl: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackEmoji?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
};

const sizePx = {
  sm: 64,
  md: 96,
  lg: 128,
  xl: 192
};

export const AnimatedDuckSticker: React.FC<AnimatedDuckStickerProps> = ({
  stickerUrl,
  alt,
  size = 'md',
  className = '',
  fallbackEmoji = '🐤'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className={`rounded-full ${sizeClasses[size]}`} />
          <motion.div 
            className="absolute text-4xl"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🐤
          </motion.div>
        </div>
      )}
      
      {/* Animated GIF sticker */}
      {!hasError && (
        <motion.img
          src={stickerUrl}
          alt={alt}
          width={sizePx[size]}
          height={sizePx[size]}
          className={`${sizeClasses[size]} object-contain rounded-lg transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isLoaded ? 1 : 0.8, 
            opacity: isLoaded ? 1 : 0 
          }}
          whileHover={{ 
            scale: 1.15,
            rotate: [0, -5, 5, -5, 0],
            transition: { duration: 0.5 }
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300,
            damping: 20
          }}
        />
      )}
      
      {/* Fallback emoji with animation */}
      {hasError && (
        <motion.div 
          className={`${sizeClasses[size]} flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full border-2 border-yellow-400/50`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ 
            scale: 1.1,
            rotate: [0, -10, 10, -10, 0]
          }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <motion.span 
            className={`${size === 'xl' ? 'text-7xl' : size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-4xl' : 'text-2xl'}`}
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {fallbackEmoji}
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};
