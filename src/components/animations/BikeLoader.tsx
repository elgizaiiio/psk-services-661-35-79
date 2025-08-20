import React from 'react';
import './BikeLoader.css';

interface BikeLoaderProps {
  className?: string;
}

const BikeLoader: React.FC<BikeLoaderProps> = ({ className = "" }) => {
  return (
    <div className={`bike-loader ${className}`} />
  );
};

export default BikeLoader;