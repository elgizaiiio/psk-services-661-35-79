import React from "react";
import { Helmet } from "react-helmet-async";

const ChatAI: React.FC = () => {
  return (
    <div className="min-h-screen relative">
      <Helmet>
        <title>التحدث مع الذكاء الاصطناعي | Viral Platform</title>
        <meta name="description" content="تحدث مع الذكاء الاصطناعي واحصل على إجابات ذكية" />
        <link rel="canonical" href={`${window.location.origin}/chat-ai`} />
      </Helmet>

      {/* Safe area at top */}
      <div className="h-8 bg-black w-full" />
      
      <div className="w-full h-[calc(100vh-2rem)]">
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