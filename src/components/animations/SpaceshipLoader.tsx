import React from 'react';
import './SpaceshipLoader.css';

const SpaceshipLoader: React.FC = () => {
  return (
    <div className="spaceship-container">
      {/* Clouds Background */}
      <div className="clouds">
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
        <div className="cloud cloud4"></div>
        <div className="cloud cloud5"></div>
      </div>

      {/* Long Fazers */}
      <div className="longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Main Spaceship */}
      <div className="loader">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className="base">
          <span></span>
          <div className="face"></div>
        </div>
      </div>
    </div>
  );
};

export default SpaceshipLoader;