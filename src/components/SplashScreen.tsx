import React, { useEffect, useState, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2500 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onCompleteRef.current();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div 
      className={`fixed inset-0 bg-background z-50 flex items-center justify-center transition-opacity duration-300 ${
        !isVisible ? 'opacity-0 pointer-events-none' : ''
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Bubble Loader */}
        <div className="bubble-loader"></div>
        
        {/* Bolt Text with French Font */}
        <h1 
          className="mt-8 text-4xl font-semibold text-primary tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Bolt
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;
