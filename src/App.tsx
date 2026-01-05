import React, { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TelegramTonConnectProvider } from "@/providers/TelegramTonConnectProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useTelegramAuth } from "./hooks/useTelegramAuth";
import { useReferralHandler } from "./hooks/useReferralHandler";
import Index from "./pages/Index";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";
import ErrorBoundary from "./components/ErrorBoundary";

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
const Game2048Store = lazy(() => import("./pages/Game2048Store"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Achievements = lazy(() => import("./pages/Achievements"));
const VIPSubscription = lazy(() => import("./pages/VIPSubscription"));
const TokenStore = lazy(() => import("./pages/TokenStore"));
const DailyTasks = lazy(() => import("./pages/DailyTasks"));
const Contest = lazy(() => import("./pages/Contest"));
const Auth = lazy(() => import("./pages/Auth"));
const Spin = lazy(() => import("./pages/Spin"));
const BuyBolt = lazy(() => import("./pages/BuyBolt"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Rules = lazy(() => import("./pages/Rules"));
const CasinoTest = lazy(() => import("./pages/CasinoTest"));

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
  const { webApp, user: telegramUser, isLoading: isTelegramLoading } = useTelegramAuth();
  const [showSplash, setShowSplash] = React.useState(true);
  const handleSplashComplete = React.useCallback(() => setShowSplash(false), []);

  useReferralHandler();

  // Preview mode (testing outside Telegram)
  const isPreviewMode = (() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isPreviewModeUrl = urlParams.get("preview") === "true";
      const isPreviewModeStorage = localStorage.getItem("previewMode") === "true";
      return isPreviewModeUrl || isPreviewModeStorage;
    } catch {
      return false;
    }
  })();

  // Check if running in Telegram Mini App (must have a real Telegram user)
  const isTelegramApp = !!webApp && !!telegramUser?.id;

  useEffect(() => {
    if (webApp) {
      // Enable full screen mode automatically
      try {
        webApp.expand();
        // Use optional chaining for methods that might not exist
        if ("requestFullscreen" in webApp) {
          (webApp as any).requestFullscreen?.();
        }
        if ("enableClosingConfirmation" in webApp) {
          (webApp as any).enableClosingConfirmation?.();
        }
        if ("disableVerticalSwipes" in webApp) {
          (webApp as any).disableVerticalSwipes?.();
        }
      } catch (e) {
        console.log("Telegram WebApp expand/fullscreen not available:", e);
      }

      if (webApp.viewportHeight) {
        document.documentElement.style.setProperty(
          "--tg-viewport-height",
          `${webApp.viewportHeight}px`
        );
      }

      const handleViewportChanged = () => {
        if (webApp.viewportHeight) {
          document.documentElement.style.setProperty(
            "--tg-viewport-height",
            `${webApp.viewportHeight}px`
          );
        }
      };

      if (webApp.onEvent) {
        webApp.onEvent("viewportChanged", handleViewportChanged);
      }

      return () => {
        if (webApp.offEvent) {
          webApp.offEvent("viewportChanged", handleViewportChanged);
        }
      };
    }
  }, [webApp]);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loader while checking Telegram auth (skip in preview mode)
  if (isTelegramLoading && !isPreviewMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to auth page if not in Telegram (unless preview mode)
  if (!isTelegramApp && !isPreviewMode) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <TelegramTonConnectProvider>
            <LanguageProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <Analytics />
                <SpeedInsights />
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
                          <ErrorBoundary>
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
                                <Route path="/game-2048-store" element={<Game2048Store />} />
                                <Route path="/challenges" element={<Challenges />} />
                                <Route path="/achievements" element={<Achievements />} />
                                <Route path="/vip" element={<VIPSubscription />} />
                                <Route path="/token-store" element={<TokenStore />} />
                                <Route path="/daily-tasks" element={<DailyTasks />} />
                                <Route path="/contest" element={<Contest />} />
                                <Route path="/spin" element={<Spin />} />
                                <Route path="/buy-bolt" element={<BuyBolt />} />
                                <Route path="/terms" element={<TermsOfService />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/rules" element={<Rules />} />
                                <Route path="/casino-test" element={<CasinoTest />} />
                              </Routes>
                            </Suspense>
                          </ErrorBoundary>
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
  </ErrorBoundary>
);

export default App;
