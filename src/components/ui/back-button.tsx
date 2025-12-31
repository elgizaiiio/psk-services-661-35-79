import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  customBackPath?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ customBackPath, className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHomePage = location.pathname === '/' || location.pathname === '/index';
  
  if (isHomePage) return null;
  
  const handleBack = () => {
    if (customBackPath) {
      navigate(customBackPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className={className}
      aria-label="رجوع"
    >
      <ArrowRight className="h-5 w-5" />
    </Button>
  );
};
