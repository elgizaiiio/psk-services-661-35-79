import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';

// Page wrapper for page transitions
interface PageWrapperProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger container for sequential animations
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  staggerDelay?: number;
}

const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const StaggerContainer: React.FC<StaggerContainerProps> = ({ 
  children, 
  staggerDelay = 0.08,
  ...props 
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.05,
        },
      },
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Fade up animation for individual elements
interface FadeUpProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
}

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export const FadeUp: React.FC<FadeUpProps> = ({ children, delay = 0, ...props }) => (
  <motion.div
    variants={fadeUpVariants}
    transition={{ delay }}
    {...props}
  >
    {children}
  </motion.div>
);

// Scale in animation for cards
interface ScaleInProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ 
      type: 'spring', 
      stiffness: 400, 
      damping: 25,
      delay 
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide in from right
interface SlideInProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const SlideIn: React.FC<SlideInProps> = ({ 
  children, 
  direction = 'right',
  ...props 
}) => {
  const directionOffset = {
    left: { x: -24, y: 0 },
    right: { x: 24, y: 0 },
    up: { x: 0, y: -24 },
    down: { x: 0, y: 24 },
  };

  return (
    <motion.div
      initial={{ ...directionOffset[direction], opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Tap animation wrapper
interface TapScaleProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  scale?: number;
}

export const TapScale: React.FC<TapScaleProps> = ({ 
  children, 
  scale = 0.97,
  ...props 
}) => (
  <motion.div
    whileTap={{ scale }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Count up animation hook
export const useCountUp = (end: number, duration: number = 1) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

// Animated number component
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.8,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = displayValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(startValue + (value - startValue) * easeProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// Progress bar with animation
interface AnimatedProgressProps {
  value: number;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({ 
  value, 
  className = '' 
}) => (
  <div className={`h-1.5 bg-muted rounded-full overflow-hidden ${className}`}>
    <motion.div
      className="h-full bg-primary rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(value, 100)}%` }}
      transition={{ 
        type: 'spring', 
        stiffness: 100, 
        damping: 20,
        delay: 0.3 
      }}
    />
  </div>
);
