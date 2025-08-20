import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Flame, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumPackages = () => {
  const navigate = useNavigate();

  const packages = [
    {
      name: 'VIP PASS',
      icon: Crown,
      color: 'neon-pink',
      price: '$49.99',
      description: 'Permanent ×2 boost to all mining',
      features: ['Double mining rewards', 'Priority support', 'Exclusive VIP badge', 'Access to VIP servers'],
      popular: true
    },
    {
      name: 'LEGENDARY BOOSTER',
      icon: Star,
      color: 'neon-purple',
      price: '$99.99',
      description: 'Ultimate mining acceleration package',
      features: ['×5 mining speed', 'Unlimited energy', 'Legendary status', 'Premium resources'],
      limited: true
    },
    {
      name: 'ELITE MEMBERSHIP',
      icon: Flame,
      color: 'neon-orange',
      price: '$199.99',
      description: 'Join the mining elite',
      features: ['×10 mining rewards', 'Elite server access', 'Custom mining rigs', 'Monthly premium packages'],
      premium: true
    },
    {
      name: 'ULTIMATE POWER',
      icon: Zap,
      color: 'neon-blue',
      price: '$299.99',
      description: 'Maximum mining potential unlocked',
      features: ['×20 mining multiplier', 'Unlimited everything', 'Custom avatar', 'Personal mining advisor'],
      ultimate: true
    }
  ];

  return (
    <div className="min-h-screen text-foreground font-rajdhani">
      <Helmet>
        <title>Premium Packages | Ultimate Mining Power</title>
        <meta name="description" content="Unlock premium mining packages and join the elite miners" />
      </Helmet>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-orbitron font-black bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
              PREMIUM PACKAGES
            </h1>
            <p className="text-muted-foreground">Unlock the full potential. Join the mining elite.</p>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, index) => (
            <Card 
              key={pkg.name} 
              className={`relative overflow-hidden border-2 border-${pkg.color}/50 bg-gradient-to-br from-${pkg.color}/10 to-background hover:border-${pkg.color} transition-all duration-500 animate-fade-in ${pkg.popular ? 'animate-neon-pulse' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {pkg.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-neon-pink text-background">MOST POPULAR</Badge>
                </div>
              )}
              {pkg.limited && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-neon-purple text-background">LIMITED</Badge>
                </div>
              )}
              {pkg.premium && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-neon-orange text-background">PREMIUM</Badge>
                </div>
              )}
              {pkg.ultimate && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-neon-blue text-background">ULTIMATE</Badge>
                </div>
              )}
              
              <CardContent className="p-6 text-center relative z-0">
                <pkg.icon className={`w-12 h-12 text-${pkg.color} mx-auto mb-4`} />
                <h3 className="font-orbitron font-bold text-xl mb-2">{pkg.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                <div className={`text-3xl font-orbitron font-black text-${pkg.color} mb-6`}>
                  {pkg.price}
                </div>
                
                <div className="space-y-2 mb-6 text-sm">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${pkg.color}`}></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button className={`w-full bg-${pkg.color}/20 border border-${pkg.color} text-${pkg.color} hover:bg-${pkg.color} hover:text-background transition-all duration-300`}>
                  GET PACKAGE
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumPackages;