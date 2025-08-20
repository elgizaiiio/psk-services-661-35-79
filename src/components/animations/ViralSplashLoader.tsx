import React from 'react';
import './ViralSplashLoader.css';

const ViralSplashLoader: React.FC = () => {
  const letters = ['V', 'I', 'R', 'A', 'L'];

  return (
    <div className="viral-loader-wrapper">
      <div className="viral-loader"></div>
      {letters.map((letter, index) => (
        <span key={index} className="viral-loader-letter">
          {letter}
        </span>
      ))}
    </div>
  );
};

export default ViralSplashLoader;