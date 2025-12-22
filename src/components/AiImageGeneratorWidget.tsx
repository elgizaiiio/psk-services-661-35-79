import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Sparkles, Image as ImageIcon, RefreshCw, Wand2, Palette } from "lucide-react";
import { downloadImage } from "@/lib/downloadImage";

const AiImageGeneratorWidget: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  
  const canGenerate = prompt.trim().length > 3 && !loading;

  const generateImage = async () => {
    if (!canGenerate) return;

    try {
      setLoading(true);
      setGeneratedImage(null);

      const { data, error } = await supabase.functions.invoke("ai-image-generator", {
        body: {
          prompt: prompt.trim(),
          width: Number(size),
          height: Number(size),
        },
      });

      if (error) throw error;

      if (data?.success && data?.image) {
        setGeneratedImage(data.image);
        setLastPrompt(prompt.trim());
        toast.success("Image generated successfully! 🎨");
      } else {
        throw new Error(data?.error || "Failed to generate image");
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      toast.error(err?.message || "Error occurred while generating image");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    const filename = `ai-generated-${Date.now()}.jpg`;
    const result = await downloadImage(generatedImage, filename);

    if (result.ok) {
      if (result.method === "open") {
        toast.success("Image opened in new tab 📂");
      } else if (result.method === "share") {
        toast.success("Share dialog opened 📤");
      } else {
        toast.success("Image downloaded! 📥");
      }
    } else {
      toast.error("Failed to save image");
    }
  };

  const regenerateImage = () => {
    if (lastPrompt && !loading) {
      setPrompt(lastPrompt);
      generateImage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      generateImage();
    }
  };

  const suggestedPrompts = [
    "Beautiful natural landscape with mountains and lake",
    "Cute cat playing in the garden",
    "Futuristic city with neon lights",
    "Sunset on the beach",
    "Artist painting in studio"
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Wand2 className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-primary">
            AI Image Generator
          </h1>
          <Palette className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Create amazing images from text descriptions using latest AI technology
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-base font-semibold">
                Image Description
              </Label>
              <Textarea
                id="prompt"
                placeholder="Write a detailed description of the image you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-[120px] bg-background border-border focus:border-primary resize-none"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Press Ctrl+Enter for quick generation
              </p>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Image Size</Label>
              <Select value={size} onValueChange={setSize} disabled={loading}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">Small (512×512)</SelectItem>
                  <SelectItem value="1024">Medium (1024×1024)</SelectItem>
                  <SelectItem value="1536">Large (1536×1536)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Quick Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1 border-border"
                    onClick={() => setPrompt(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateImage}
              disabled={!canGenerate}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 text-lg"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="simple-loader w-5 h-5"></div>
                  Generating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Image
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
                <div className="simple-loader"></div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">Generating your amazing image...</p>
                  <p className="text-muted-foreground">This may take a few moments</p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="relative group overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-colors">
                  <img
                    src={generatedImage}
                    alt={lastPrompt}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDownload}
                        variant="secondary"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={regenerateImage}
                        variant="secondary"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Used description:</p>
                  <p className="text-sm font-medium">{lastPrompt}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-primary/60" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">No image yet</p>
                  <p className="text-muted-foreground">
                    Enter an image description and click Generate Image
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center">💡 Tips for Best Results</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Be Clear and Detailed:</h4>
              <p className="text-muted-foreground">
                Use precise and detailed descriptions for more accurate images
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Add Details:</h4>
              <p className="text-muted-foreground">
                Mention colors, lighting, and desired artistic style
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Try Different Words:</h4>
              <p className="text-muted-foreground">
                If you don't like the result, try modifying the description slightly
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Use Suggestions:</h4>
              <p className="text-muted-foreground">
                Click on the suggestions above as a starting point
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiImageGeneratorWidget;
