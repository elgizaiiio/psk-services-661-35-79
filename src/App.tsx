import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TelegramTonConnectProvider } from "@/providers/TelegramTonConnectProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useTelegramAuth } from "./hooks/useTelegramAuth";
import { useReferralHandler } from "./hooks/useReferralHandler";
import Index from "./pages/Index";

import ServerStore from "./pages/ServerStore";
import UpgradeCenter from "./pages/UpgradeCenter";
import Tasks from "./pages/Tasks";
import Game from "./pages/Game";
import Games from "./pages/Games";
import Apps from "./pages/Apps";
import Skins from "./pages/Skins";
import Leaderboard from "./pages/Leaderboard";
import BottomNavigation from "./components/BottomNavigation";
import Runner from "./pages/Runner";
import RunnerGamePage from "./pages/RunnerGame";
import AiGenerator from "./pages/AiGenerator";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Mining from "./pages/Mining";
import Invite from "./pages/Invite";
import PremiumPackages from "./pages/PremiumPackages";
import EliteAddOns from "./pages/EliteAddOns";
import UpgradeMatrix from "./pages/UpgradeMatrix";
import LegendaryServers from "./pages/LegendaryServers";
import AiSubscription from "./pages/AiSubscription";
import MiningServers from "./pages/MiningServers";
import Events from "./pages/Events";
import AiImageStore from "./pages/AiImageStore";
import Game2048Store from "./pages/Game2048Store";
import Giveaways from "./pages/Giveaways";
import CreateTask from "./pages/CreateTask";
import Admin from "./pages/Admin";
import ChatAI from "./pages/ChatAI";
import Slots from "./pages/Slots";
import Settings from "./pages/Settings";
import Challenges from "./pages/Challenges";
import Characters from "./pages/Characters";
import Achievements from "./pages/Achievements";
import VIPSubscription from "./pages/VIPSubscription";
import TokenStore from "./pages/TokenStore";
import DailyTasks from "./pages/DailyTasks";
import MiniGames from "./pages/MiniGames";
import SplashScreen from "./components/SplashScreen";


function ScrollToBottom() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  }, [location.pathname, location.search]);
  return null;
}

const queryClient = new QueryClient();

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
              <TelegramWebAppWrapper>
                <div className="tg-webapp-container min-h-screen bg-background relative">
                  <div className="pt-6 relative z-10">
                    <ScrollToBottom />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/mining" element={<Mining />} />
                      <Route path="/apps" element={<Apps />} />
                      <Route path="/games" element={<Games />} />
                      <Route path="/runner" element={<Runner />} />
                      <Route path="/runner-game" element={<RunnerGamePage />} />
                      <Route path="/ai-generator" element={<AiGenerator />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/game" element={<Game />} />
                      <Route path="/skins" element={<Skins />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
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
                      <Route path="/game-2048-store" element={<Game2048Store />} />
                      <Route path="/giveaways" element={<Giveaways />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/create-task" element={<CreateTask />} />
                      <Route path="/chat-ai" element={<ChatAI />} />
                      <Route path="/slots" element={<Slots />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/challenges" element={<Challenges />} />
                      <Route path="/characters" element={<Characters />} />
                      <Route path="/achievements" element={<Achievements />} />
                      <Route path="/vip" element={<VIPSubscription />} />
                      <Route path="/token-store" element={<TokenStore />} />
                      <Route path="/daily-tasks" element={<DailyTasks />} />
                      <Route path="/mini-games" element={<MiniGames />} />
                    </Routes>
                    <BottomNavigation />
                  </div>
                </div>
              </TelegramWebAppWrapper>
            </TooltipProvider>
          </LanguageProvider>
        </TelegramTonConnectProvider>
      </Router>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
