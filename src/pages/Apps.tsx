import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MessageCircle, Image, ChevronRight } from "lucide-react";

const Apps: React.FC = () => {
  const navigate = useNavigate();
  const apps = [
    {
      title: 'AI Chat',
      description: 'Smart conversation assistant',
      icon: MessageCircle,
      path: '/chat-ai'
    },
    {
      title: 'AI Image Generator',
      description: 'Create stunning AI artwork',
      icon: Image,
      path: '/runner'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Apps | Bolt Platform</title>
        <meta name="description" content="Explore AI applications" />
        <link rel="canonical" href={`${window.location.origin}/apps`} />
      </Helmet>

      {/* Header */}
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">AI Apps</h1>
        <p className="text-muted-foreground">Explore the future of AI technology</p>
      </div>

      {/* Apps Grid */}
      <div className="px-6 space-y-4 max-w-md">
        {apps.map(app => {
          const IconComponent = app.icon;
          return (
            <div
              key={app.path}
              onClick={() => navigate(app.path)}
              className="group relative bg-card border border-border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {app.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{app.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Apps;
