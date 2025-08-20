import React from 'react';
import './CandleAnimation.css';
const CandleAnimation = () => {
  return <div className="wrapper">
      <div className="fire">
        <div className="fire-center mx-[144px] my-0 px-0 rounded-none">
          
          <div className="particle-fire"></div>
        </div>
        <div className="fire-right">
          <div className="main-fire my-0 py-0 px-[4px] mx-[80px]"></div>
          <div className="particle-fire"></div>
        </div>
        <div className="fire-left mx-[210px]">
          <div className="main-fire mx-0"></div>
          <div className="particle-fire"></div>
        </div>
        <div className="fire-bottom">
          <div className="main-fire px-0 mx-[64px]"></div>
        </div>
      </div>
    </div>;
};
export default CandleAnimation;