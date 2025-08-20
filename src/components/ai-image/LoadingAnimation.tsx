import React from "react";

interface LoadingAnimationProps {
  size?: "sm" | "md" | "lg";
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5", 
    lg: "w-8 h-8"
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
      <div className="absolute inset-2 rounded-full border border-primary/30 animate-pulse"></div>
    </div>
  );
};

export default LoadingAnimation;