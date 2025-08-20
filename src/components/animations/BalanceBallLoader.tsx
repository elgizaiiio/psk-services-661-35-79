import React from 'react';
import './BalanceBallLoader.css';

const BalanceBallLoader: React.FC = () => {
  return (
    <div className="balance-loader">
      <div className="ball"></div>
      <div className="ball"></div>
    </div>
  );
};

export default BalanceBallLoader;