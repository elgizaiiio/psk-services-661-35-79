import React from 'react';

const FloatingCircles = () => {
  return (
    <div className="flex items-center justify-center h-20 mt-8">
      <div className="floating-loader">
        <div className="floating-loader__circle"></div>
        <div className="floating-loader__circle"></div>
        <div className="floating-loader__circle"></div>
        <div className="floating-loader__circle"></div>
        <div className="floating-loader__circle"></div>
      </div>
    </div>
  );
};

export default FloatingCircles;