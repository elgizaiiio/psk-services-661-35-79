import { Helmet } from "react-helmet-async";
import { ExternalLink, Smartphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BoltIcon from "@/components/ui/bolt-icon";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const telegramBotUrl = "https://t.me/boltrsbot?start=mining";
  const navigate = useNavigate();

  // Check for preview mode via URL param
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get('preview') === 'true';

  const handleOpenTelegram = () => {
    window.open(telegramBotUrl, "_blank");
  };

  const handlePreviewMode = () => {
    // Navigate to home with preview flag in localStorage
    localStorage.setItem('previewMode', 'true');
    navigate('/');
  };

  // If already in preview mode, redirect to home
  if (isPreviewMode) {
    localStorage.setItem('previewMode', 'true');
    navigate('/');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Open in Telegram | Bolt Mining</title>
        <meta name="description" content="Open Bolt Mining app in Telegram to start earning" />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BoltIcon className="w-12 h-12 text-primary" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Start Mining with Telegram
              </h1>
              <p className="text-muted-foreground">
                Open Bolt Mining in Telegram to start earning tokens
              </p>
            </div>

            {/* Telegram Button */}
            <Button
              onClick={handleOpenTelegram}
              size="lg"
              className="w-full gap-2 text-lg py-6"
            >
              <Smartphone className="w-5 h-5" />
              Open in Telegram
              <ExternalLink className="w-4 h-4" />
            </Button>

            {/* Preview Mode Button */}
            <Button
              onClick={handlePreviewMode}
              variant="outline"
              size="lg"
              className="w-full gap-2"
            >
              <Eye className="w-5 h-5" />
              Preview Mode (Testing)
            </Button>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Click the button above to open the Telegram bot</p>
              <p>Then tap "Start" to begin mining</p>
            </div>

            {/* Direct Link */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Or open this link in Telegram:
              </p>
              <a
                href={telegramBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm font-medium"
              >
                @boltrsbot
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Auth;
