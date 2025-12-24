import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useMiningCharacters } from "@/hooks/useMiningCharacters";
import { CharacterCard } from "@/components/mining/CharacterCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Users, Crown, Zap, Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Characters = () => {
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const { t, isRTL } = useLanguage();
  const [boltUserId, setBoltUserId] = useState<string | undefined>();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  // Get bolt user id
  useEffect(() => {
    const fetchBoltUser = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('bolt_users')
        .select('id, token_balance')
        .eq('telegram_id', user.id)
        .maybeSingle();
      
      if (data) {
        setBoltUserId(data.id);
        setTokenBalance(data.token_balance);
      }
    };
    fetchBoltUser();
  }, [user?.id]);

  const { 
    characters, 
    userCharacters, 
    activeCharacter, 
    loading, 
    purchaseCharacter, 
    activateCharacter,
    refetch 
  } = useMiningCharacters(boltUserId);

  const handlePurchase = async (characterId: string, method: 'ton' | 'tokens') => {
    setPurchaseLoading(characterId);
    const success = await purchaseCharacter(characterId, method);
    if (success) {
      // Refresh token balance
      if (boltUserId) {
        const { data } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', boltUserId)
          .single();
        if (data) setTokenBalance(data.token_balance);
      }
    }
    setPurchaseLoading(null);
  };

  const handleActivate = async (userCharacterId: string) => {
    setPurchaseLoading(userCharacterId);
    await activateCharacter(userCharacterId);
    setPurchaseLoading(null);
  };

  const getUserCharacter = (characterId: string) => {
    return userCharacters.find(uc => uc.character_id === characterId);
  };

  const filteredCharacters = characters.filter(char => {
    if (activeTab === "all") return true;
    if (activeTab === "owned") return getUserCharacter(char.id);
    return char.tier === activeTab;
  });

  const tierCounts = {
    beginner: characters.filter(c => c.tier === 'beginner').length,
    professional: characters.filter(c => c.tier === 'professional').length,
    expert: characters.filter(c => c.tier === 'expert').length,
    master: characters.filter(c => c.tier === 'master').length,
    legendary: characters.filter(c => c.tier === 'legendary').length,
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-2xl border-b border-border/20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowRight className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
              رجوع
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                الشخصيات
              </h1>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">الرصيد</p>
              <p className="text-lg font-bold text-primary">{tokenBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">VIRAL</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 text-center">
              <p className="text-xs text-muted-foreground">مملوكة</p>
              <p className="text-lg font-bold text-green-400">{userCharacters.length}</p>
              <p className="text-xs text-muted-foreground">شخصية</p>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-center">
              <p className="text-xs text-muted-foreground">نشطة</p>
              <p className="text-lg font-bold text-yellow-400 truncate text-sm">
                {activeCharacter?.character?.name || 'لا يوجد'}
              </p>
            </Card>
          </div>
        </div>
      </header>

      {/* Active Character Highlight */}
      {activeCharacter && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3"
        >
          <Card className="p-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border-primary/30">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{activeCharacter.character?.image_url}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">{activeCharacter.character?.name}</h3>
                  <Badge className="bg-primary text-primary-foreground">نشط</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="text-green-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {activeCharacter.character?.mining_speed_multiplier}x سرعة
                  </span>
                  <span className="text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    +{activeCharacter.character?.boost_percentage}% تعزيز
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tabs Filter */}
      <div className="px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/30">
            <TabsTrigger value="all" className="text-xs py-2">
              الكل ({characters.length})
            </TabsTrigger>
            <TabsTrigger value="owned" className="text-xs py-2">
              مملوكة ({userCharacters.length})
            </TabsTrigger>
            <TabsTrigger value="professional" className="text-xs py-2 text-blue-400">
              محترف ({tierCounts.professional})
            </TabsTrigger>
            <TabsTrigger value="legendary" className="text-xs py-2 text-yellow-400">
              أسطوري ({tierCounts.legendary})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tier Legend */}
      <div className="px-4 py-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { tier: 'beginner', label: 'مبتدئ', color: 'bg-slate-500' },
            { tier: 'professional', label: 'محترف', color: 'bg-blue-500' },
            { tier: 'expert', label: 'خبير', color: 'bg-purple-500' },
            { tier: 'master', label: 'ماستر', color: 'bg-orange-500' },
            { tier: 'legendary', label: 'أسطوري', color: 'bg-yellow-500' },
          ].map(({ tier, label, color }) => (
            <button
              key={tier}
              onClick={() => setActiveTab(tier)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                activeTab === tier ? 'ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Characters Grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCharacters.length === 0 ? (
          <Card className="p-8 text-center">
            <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد شخصيات في هذه الفئة</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCharacters.map((character, index) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CharacterCard
                    character={character}
                    userCharacter={getUserCharacter(character.id)}
                    onPurchase={handlePurchase}
                    onActivate={handleActivate}
                    isLoading={purchaseLoading === character.id || purchaseLoading === getUserCharacter(character.id)?.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="px-4 py-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            كيف تعمل الشخصيات؟
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              كل شخصية تمنحك مضاعف سرعة تعدين مختلف
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              الشخصيات الأعلى مستوى تعطي تعزيزات أكبر
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              يمكنك امتلاك عدة شخصيات وتفعيل واحدة فقط
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              الشخصيات الأسطورية تمنح مكافآت جاكبوت إضافية
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Characters;
