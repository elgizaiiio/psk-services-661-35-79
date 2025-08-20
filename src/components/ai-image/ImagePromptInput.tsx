import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import LoadingAnimation from "./LoadingAnimation";
interface ImagePromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  loading: boolean;
}
const ImagePromptInput: React.FC<ImagePromptInputProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  loading
}) => {
  return <div className="glassmorphism rounded-md p-1 flex items-center gap-1 max-w-xs">
      <div className="flex-1">
        <Textarea placeholder="Image description..." value={prompt} onChange={e => onPromptChange(e.target.value)} className="h-6 text-xs bg-input/50 border-border/50 focus:border-primary/50 resize-none py-0 px-1" disabled={loading} />
      </div>
      <Button onClick={onGenerate} disabled={!prompt.trim() || loading} className="btn-primary p-1 rounded-md flex items-center justify-center h-6 w-6">
        {loading ? <LoadingAnimation size="sm" /> : <Sparkles className="w-3 h-3" />}
      </Button>
    </div>;
};
export default ImagePromptInput;