import React, { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TelegramTonConnectProvider } from "@/providers/TelegramTonConnectProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useTelegramAuth } from "./hooks/useTelegramAuth";
import { useReferralHandler } from "./hooks/useReferralHandler";
import Index from "./pages/Index";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";

// Lazy load pages for better performance
const ServerStore = lazy(() => import("./pages/ServerStore"));
const UpgradeCenter = lazy(() => import("./pages/UpgradeCenter"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Apps = lazy(() => import("./pages/Apps"));
const Skins = lazy(() => import("./pages/Skins"));
const AiGenerator = lazy(() => import("./pages/AiGenerator"));
const Profile = lazy(() => import("./pages/Profile"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Mining = lazy(() => import("./pages/Mining"));
const Invite = lazy(() => import("./pages/Invite"));
const PremiumPackages = lazy(() => import("./pages/PremiumPackages"));
const EliteAddOns = lazy(() => import("./pages/EliteAddOns"));
const UpgradeMatrix = lazy(() => import("./pages/UpgradeMatrix"));
const LegendaryServers = lazy(() => import("./pages/LegendaryServers"));
const AiSubscription = lazy(() => import("./pages/AiSubscription"));
const MiningServers = lazy(() => import("./pages/MiningServers"));
const Events = lazy(() => import("./pages/Events"));
const AiImageStore = lazy(() => import("./pages/AiImageStore"));
const Giveaways = lazy(() => import("./pages/Giveaways"));
const CreateTask = lazy(() => import("./pages/CreateTask"));
const Admin = lazy(() => import("./pages/Admin"));
const ChatAI = lazy(() => import("./pages/ChatAI"));
const Slots = lazy(() => import("./pages/Slots"));
const Settings = lazy(() => import("./pages/Settings"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Achievements = lazy(() => import("./pages/Achievements"));
const VIPSubscription = lazy(() => import("./pages/VIPSubscription"));
const TokenStore = lazy(() => import("./pages/TokenStore"));
const DailyTasks = lazy(() => import("./pages/DailyTasks"));
const KrunkerGame = lazy(() => import("./pages/KrunkerGame"));
const Auth = lazy(() => import("./pages/Auth"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function TelegramWebAppWrapper({ children }: { children: React.ReactNode }) {
  const { webApp } = useTelegramAuth();
  const [showSplash, setShowSplash] = React.useState(true);
  
  useReferralHandler();

  useEffect(() => {
    if (webApp) {
      if (webApp.viewportHeight) {
        document.documentElement.style.setProperty(
          '--tg-viewport-height', 
          `${webApp.viewportHeight}px`
        );
      }

      const handleViewportChanged = () => {
        if (webApp.viewportHeight) {
          document.documentElement.style.setProperty(
            '--tg-viewport-height', 
            `${webApp.viewportHeight}px`
          );
        }
      };

      if (webApp.onEvent) {
        webApp.onEvent('viewportChanged', handleViewportChanged);
      }

      return () => {
        if (webApp.offEvent) {
          webApp.offEvent('viewportChanged', handleViewportChanged);
        }
      };
    }
  }, [webApp]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <>{children}</>;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <Router>
        <TelegramTonConnectProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Auth page - outside Telegram wrapper */}
                <Route path="/auth" element={
                  <Suspense fallback={<PageLoader />}>
                    <Auth />
                  </Suspense>
                } />
                {/* All routes with Telegram auth */}
                <Route path="/*" element={
                  <TelegramWebAppWrapper>
                    <div className="tg-webapp-container min-h-screen bg-background relative">
                      <div className="pt-6 relative z-10">
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/mining" element={<Mining />} />
                            <Route path="/apps" element={<Apps />} />
                            <Route path="/ai-generator" element={<AiGenerator />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/skins" element={<Skins />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/invite" element={<Invite />} />
                            <Route path="/wallet" element={<Wallet />} />
                            <Route path="/server-store" element={<ServerStore />} />
                            <Route path="/upgrade-center" element={<UpgradeCenter />} />
                            <Route path="/premium-packages" element={<PremiumPackages />} />
                            <Route path="/elite-addons" element={<EliteAddOns />} />
                            <Route path="/upgrade-matrix" element={<UpgradeMatrix />} />
                            <Route path="/legendary-servers" element={<LegendaryServers />} />
                            <Route path="/ai-subscription" element={<AiSubscription />} />
                            <Route path="/mining-servers" element={<MiningServers />} />
                            <Route path="/events" element={<Events />} />
                            <Route path="/ai-image-store" element={<AiImageStore />} />
                            <Route path="/giveaways" element={<Giveaways />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/create-task" element={<CreateTask />} />
                            <Route path="/chat-ai" element={<ChatAI />} />
                            <Route path="/slots" element={<Slots />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/challenges" element={<Challenges />} />
                            <Route path="/achievements" element={<Achievements />} />
                            <Route path="/vip" element={<VIPSubscription />} />
                            <Route path="/token-store" element={<TokenStore />} />
                            <Route path="/daily-tasks" element={<DailyTasks />} />
                            <Route path="/game" element={<KrunkerGame />} />
                          </Routes>
                        </Suspense>
                        <BottomNavigation />
                      </div>
                    </div>
                  </TelegramWebAppWrapper>
                } />
              </Routes>
            </TooltipProvider>
          </LanguageProvider>
        </TelegramTonConnectProvider>
      </Router>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
