import React, { useEffect, useState, useRef } from 'react';
import BoltIcon from './ui/bolt-icon';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);
  
  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onCompleteRef.current();
      }, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]); // Only depend on duration, not onComplete

  return (
    <div className={`fixed inset-0 bg-background z-50 flex items-center justify-center transition-opacity duration-200 ${!isVisible ? 'opacity-0 pointer-events-none' : ''}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <BoltIcon size="xl" className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-bold text-primary">Bolt</h1>
        <p className="text-muted-foreground">Mining Platform</p>
        <div className="simple-loader mx-auto mt-6"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
