import React from "react";
import { Helmet } from "react-helmet-async";

const Games: React.FC = () => {
  return (
    <div className="min-h-screen relative">
      <Helmet>
        <title>Apps | Viral Platform</title>
        <meta name="description" content="Explore amazing apps and tools on our platform" />
        <link rel="canonical" href={`${window.location.origin}/apps`} />
      </Helmet>

      {/* Safe area at top */}
      <div className="h-8 bg-black w-full" />
      
      <div className="w-full h-[calc(100vh-2rem)]">
        <iframe
          src="https://pulse-robot-template-26766-71.vercel.app/"
          className="w-full h-full border-0"
          title="Apps Platform"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Games;