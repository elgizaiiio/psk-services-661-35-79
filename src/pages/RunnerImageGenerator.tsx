import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RunnerImageGenerator: React.FC = () => {
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Helmet>
        <title>AI Image Generator</title>
        <meta name="description" content="Generate stunning images with AI technology" />
        <link rel="canonical" href={`${origin}/runner-image-generator`} />
      </Helmet>

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">AI Image Generator</h1>
          <p className="text-muted-foreground">Create stunning images with AI</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Describe Your Image
              </h2>
              
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create in detail..."
                  className="w-full h-32 p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="simple-loader w-5 h-5"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <span>⚡ Generate Image</span>
              )}
            </Button>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Generated Image
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="simple-loader"></div>
                  <div className="text-center space-y-2">
                    <p className="text-foreground font-medium">Creating your masterpiece...</p>
                    <p className="text-muted-foreground text-sm">This may take a few moments</p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <div className="relative group overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300">
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
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Used description:</p>
                    <p className="text-sm font-medium text-foreground">{prompt}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl">⚡</span>
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
