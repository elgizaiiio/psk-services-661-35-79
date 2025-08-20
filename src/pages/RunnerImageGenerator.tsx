import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BikeLoader from "@/components/animations/BikeLoader";

const RunnerImageGenerator: React.FC = () => {
  const navigate = useNavigate();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please write an image description");
      return;
    }

    try {
      setLoading(true);
      setGeneratedImage(null);

      const { data, error } = await supabase.functions.invoke("ai-image-generator", {
        body: {
          prompt: prompt.trim(),
          width: 1024,
          height: 1024
        }
      });

      if (error) throw error;

      if (data?.success && data?.image) {
        setGeneratedImage(data.image);
        toast.success("Image generated successfully!");
      } else {
        throw new Error(data?.error || "Failed to generate image");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error occurred while generating image");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <Helmet>
        <title>AI Image Generator</title>
        <meta name="description" content="Generate stunning images with AI technology" />
        <link rel="canonical" href={`${origin}/runner-image-generator`} />
      </Helmet>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Animation Section */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <BikeLoader className="primary relative z-10" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="backdrop-blur-sm bg-card/50 border border-primary/20 rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Describe Your Image
              </h2>
              
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create in detail..."
                  className="w-full h-32 p-4 bg-background/70 border border-primary/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all duration-200"
                  disabled={loading}
                />
                
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <BikeLoader />
                  <span>Generating Magic...</span>
                </div>
              ) : (
                <span>✨ Generate Image</span>
              )}
            </Button>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            <div className="backdrop-blur-sm bg-card/50 border border-primary/20 rounded-xl p-6 shadow-xl min-h-[400px]">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                Generated Image
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="relative">
                    <BikeLoader />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-foreground font-medium">Creating your masterpiece...</p>
                    <p className="text-muted-foreground text-sm">This may take a few moments</p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <div className="relative group overflow-hidden rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <img
                      src={generatedImage}
                      alt="Generated image"
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        onClick={handleDownload}
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-background/50 rounded-lg p-3 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Used description:</p>
                    <p className="text-sm font-medium text-foreground">{prompt}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">✨</span>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-foreground font-semibold">Ready to Create</p>
                    <p className="text-muted-foreground text-sm">
                      Enter your description and generate your first AI image
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RunnerImageGenerator;