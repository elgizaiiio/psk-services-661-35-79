import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Palette, 
  Image, 
  Zap,
  Crown,
  Star,
  
  ShoppingBag,
  Coins,
  CheckCircle,
  Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useAiUsageLimit } from '@/hooks/useAiUsageLimit';
import { toast } from 'sonner';

const aiImagePackages = [
  {
    id: 1,
    name: 'Starter',
    description: 'Perfect for beginners',
    credits: 50,
    price: '0.5 TON',
    priceValue: 0.5,
    features: ['50 AI Images', 'Standard Quality', 'Basic Support'],
    popular: true,
    icon: Palette,
    gradient: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-500/10 text-emerald-600'
  },
  {
    id: 2,
    name: 'Pro',
    description: 'Great value',
    credits: 150,
    price: '1.2 TON',
    priceValue: 1.2,
    features: ['150 AI Images', 'High Quality', 'Priority Support'],
    popular: false,
    icon: Star,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    badgeColor: 'bg-blue-500/10 text-blue-600'
  },
  {
    id: 3,
    name: 'Elite',
    description: 'Best value',
    credits: 500,
    price: '3 TON',
    priceValue: 3,
    features: ['500 AI Images', 'Ultra Quality', 'VIP Support'],
    popular: false,
    icon: Crown,
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-500/10 text-purple-600'
  }
];

const AiImageStoreInner: React.FC = () => {
  const navigate = useNavigate();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const { addCredits, usageStats } = useAiUsageLimit();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const handlePurchase = async (pkg: typeof aiImagePackages[0]) => {
    setSelectedPackage(pkg.id);
    
    const success = await sendDirectPayment({
      amount: pkg.priceValue,
      description: `AI Image Credits - ${pkg.name}`,
      productType: 'ai_credits',
      productId: pkg.id.toString(),
      credits: pkg.credits
    });

    if (success) {
      addCredits(pkg.credits);
      toast.success(`Successfully added ${pkg.credits} credits!`);
    }
    
    setSelectedPackage(null);
  };

  return (
    <>
      <Helmet>
        <title>AI Image Generator Store | Premium AI Image Packages</title>
        <meta name="description" content="Buy premium AI image generator packages with TON cryptocurrency. Get high-quality AI-generated images with instant delivery." />
        <meta name="keywords" content="AI image generator, TON payment, cryptocurrency, digital art, AI art" />
        <link rel="canonical" href="/ai-image-store" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          
          {/* Header */}
          <header className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                AI Image Store
              </h1>
              <p className="text-sm text-muted-foreground">Buy credits with TON</p>
            </div>
          </header>

          {/* Current Credits */}
          <Card className="mb-4 border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="font-medium">Credits</span>
                </div>
                <div className="text-xl font-bold text-primary">{usageStats.remainingCredits}</div>
              </div>
            </CardContent>
          </Card>

          {/* Packages */}
          <section className="space-y-3" aria-label="AI Image Packages">
            {aiImagePackages.map((pkg, index) => {
              const PackageIcon = pkg.icon;
              const isSelected = selectedPackage === pkg.id;
              
              return (
                <Card 
                  key={pkg.id}
                  className={`relative overflow-hidden border transition-all duration-300 hover:shadow-lg group cursor-pointer ${
                    pkg.popular 
                      ? 'border-emerald-500/40 shadow-md shadow-emerald-500/10'
                      : 'border-border/30 hover:border-primary/40'
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  
                  {/* Package Content */}
                  <CardContent className="p-3">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold">{pkg.name}</h3>
                        <p className="text-xs text-muted-foreground">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{pkg.price}</div>
                        <Badge className={`${pkg.badgeColor} text-xs`} variant="outline">
                          {pkg.credits} Credits
                        </Badge>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-3 space-y-1">
                      {pkg.features.slice(0, 2).map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Purchase Button */}
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg);
                      }}
                      disabled={isProcessing && selectedPackage === pkg.id}
                      className={`w-full mt-3 ${
                        pkg.popular 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                          : ''
                      }`}
                      size="sm"
                    >
                        {isProcessing && selectedPackage === pkg.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Processing payment...
                        </div>
                      ) : (
                        <>
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          Buy with TON
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </section>

        </div>
      </main>
    </>
  );
};

const AiImageStore: React.FC = () => {
  return (
    <AiImageStoreInner />
  );
};

export default AiImageStore;