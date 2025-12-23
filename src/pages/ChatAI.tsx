import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const ChatAI: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative bg-background">
      <Helmet>
        <title>التحدث مع الذكاء الاصطناعي | Viral Platform</title>
        <meta name="description" content="تحدث مع الذكاء الاصطناعي واحصل على إجابات ذكية" />
        <link rel="canonical" href={`${window.location.origin}/chat-ai`} />
      </Helmet>

      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-foreground">الدردشة مع AI</h1>
        </div>
      </div>
      
      <div className="w-full h-[calc(100vh-3.5rem)]">
        <iframe
          src="https://pulse-robot-template-26766-90.vercel.app/"
          className="w-full h-full border-0"
          title="AI Chat Platform"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default ChatAI;