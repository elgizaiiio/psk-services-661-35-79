import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingAnimation from "./LoadingAnimation";

interface ImageResultCardProps {
  loading: boolean;
  generatedImage: string | null;
}

const ImageResultCard: React.FC<ImageResultCardProps> = ({
  loading,
  generatedImage
}) => {
  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="glassmorphism rounded-lg p-2 min-h-[160px]">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-40 space-y-2">
          <LoadingAnimation size="md" />
          <p className="text-xs text-muted-foreground">Generating...</p>
        </div>
      ) : generatedImage ? (
        <div className="relative group">
          <img 
            src={generatedImage} 
            alt="Generated image" 
            className="w-full h-40 object-cover rounded-md cursor-pointer"
            onClick={handleDownload}
          />
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleDownload}
              variant="secondary"
              size="sm"
              className="p-1 h-6 w-6"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 space-y-2">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">Image will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageResultCard;