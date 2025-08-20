import React from "react";
import { Helmet } from "react-helmet-async";
import AiImageGeneratorWidget from "@/components/AiImageGeneratorWidget";

const AiImageGeneratorPage: React.FC = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="max-w-4xl mx-auto pb-24 px-4">
      <Helmet>
        <title>AI Image Generator | Professional Image Creation</title>
        <meta name="description" content="Generate professional high-quality images from text descriptions using the latest AI technology - free and unlimited" />
        <link rel="canonical" href={`${origin}/ai-generator`} />
        <meta property="og:title" content="AI Image Generator" />
        <meta property="og:description" content="Generate professional high-quality images for free" />
        <meta property="og:type" content="website" />
      </Helmet>

      <AiImageGeneratorWidget />
    </main>
  );
};

export default AiImageGeneratorPage;
