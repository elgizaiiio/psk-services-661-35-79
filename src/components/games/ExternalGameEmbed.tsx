import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExternalGameEmbedProps {
  embedUrl: string;
  title: string;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const ExternalGameEmbed: React.FC<ExternalGameEmbedProps> = ({
  embedUrl,
  title,
  onClose,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-full aspect-[16/10] rounded-xl overflow-hidden'}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">جاري تحميل اللعبة...</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        {onToggleFullscreen && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleFullscreen}
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        )}
        {onClose && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Game iframe */}
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; fullscreen; gamepad"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default ExternalGameEmbed;
