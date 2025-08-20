import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { MessageCircle, Image, ArrowLeft, ChevronRight } from "lucide-react";
import GeometricLoader from "@/components/animations/GeometricLoader";
const Apps: React.FC = () => {
  const navigate = useNavigate();
  const apps = [{
    title: 'AI Chat',
    description: 'Smart conversation assistant',
    icon: MessageCircle,
    path: '/chat-ai'
  }, {
    title: 'AI Image Generator',
    description: 'Create stunning AI artwork',
    icon: Image,
    path: '/runner'
  }];
  return <div className="min-h-screen">
      <Helmet>
        <title>Apps | Viral Platform</title>
        <meta name="description" content="Explore AI applications" />
        <link rel="canonical" href={`${window.location.origin}/apps`} />
      </Helmet>

      {/* Geometric Animation */}
      <div className="px-6 pt-8">
        <GeometricLoader />
      </div>

      {/* Header */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          
          <div>
            
            
          </div>
        </div>

        {/* Apps Grid */}
        <div className="space-y-4 max-w-md">
          {apps.map(app => {
          const IconComponent = app.icon;
          return <div key={app.path} onClick={() => navigate(app.path)} className="group relative bg-card border border-border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:bg-card/80 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 py-0">
                {/* Content */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 flex items-center justify-center transition-colors rounded-full bg-transparent">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Text */}
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {app.title}
                      </h3>
                      
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>;
        })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-center text-white">
            Explore the future of AI technology
          </p>
        </div>
      </div>
    </div>;
};
export default Apps;