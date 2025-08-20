import React from "react";
import "./SnowLoaderAnimation.css";

const SnowLoaderAnimation: React.FC = () => {
  return (
    <div className="snow-loader-container">
      <div className="wrapper">
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
        <div className="shadow"></div>
      </div>
    </div>
  );
};

export default SnowLoaderAnimation;