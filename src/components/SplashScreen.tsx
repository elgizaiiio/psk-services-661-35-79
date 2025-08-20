import React, { useEffect, useState } from 'react';
import ViralSplashLoader from './animations/ViralSplashLoader';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-300 opacity-0 pointer-events-none">
        <ViralSplashLoader />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-300">
      <ViralSplashLoader />
    </div>
  );
};

export default SplashScreen;