import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sun, Cpu, CloudSnow, Layers, Battery, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EliteAddOns = () => {
  const navigate = useNavigate();

  const addOns = [
    {
      name: 'Solar Battery',
      icon: Sun,
      description: 'Infinite power from the sun',
      price: '$149',
      boost: '+50% Efficiency',
      color: 'neon-yellow'
    },
    {
      name: 'AI Chip',
      icon: Cpu,
      description: 'Smart optimization algorithms',
      price: '$199',
      boost: '+75% Performance',
      color: 'neon-blue'
    },
    {
      name: 'Smart Cooling Tower',
      icon: CloudSnow,
      description: 'Zero heat generation',
      price: '$99',
      boost: '100% Uptime',
      color: 'neon-cyan'
    },
    {
      name: 'Cloud Mining',
      icon: Layers,
      description: 'Mine from anywhere',
      price: '$299',
      boost: '24/7 Mining',
      color: 'neon-purple'
    },
    {
      name: 'Quantum Battery',
      icon: Battery,
      description: 'Unlimited energy storage',
      price: '$399',
      boost: 'Infinite Power',
      color: 'neon-green'
    },
    {
      name: 'Nano Shield',
      icon: Shield,
      description: 'Ultimate server protection',
      price: '$249',
      boost: '100% Security',
      color: 'neon-pink'
    },
    {
      name: 'Lightning Core',
      icon: Zap,
      description: 'Instant processing speed',
      price: '$499',
      boost: 'Instant Mining',
      color: 'neon-orange'
    },
    {
      name: 'Fusion Reactor',
      icon: Sun,
      description: 'Nuclear-powered mining',
      price: '$999',
      boost: '+1000% Power',
      color: 'neon-red'
    }
  ];

  return (
    <div className="min-h-screen text-foreground font-rajdhani">
      <Helmet>
        <title>Elite Add-Ons | Legendary Mining Enhancements</title>
        <meta name="description" content="Legendary enhancements that separate the elite from the masses" />
      </Helmet>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-orbitron font-black bg-gradient-to-r from-neon-orange to-neon-pink bg-clip-text text-transparent">
              ELITE ADD-ONS
            </h1>
            <p className="text-muted-foreground">Legendary enhancements that separate the elite from the masses.</p>
          </div>
        </div>

        {/* Add-Ons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {addOns.map((addon, index) => (
            <Card 
              key={addon.name} 
              className={`relative overflow-hidden border border-${addon.color}/20 bg-gradient-to-br from-card/80 to-background group hover:border-${addon.color} transition-all duration-500 animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-${addon.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <CardContent className="p-6 relative z-10 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-${addon.color}/10 flex items-center justify-center border border-${addon.color}/30`}>
                  <addon.icon className={`w-8 h-8 text-${addon.color}`} />
                </div>
                
                <h3 className="font-orbitron font-bold text-lg mb-2">{addon.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                
                <Badge variant="secondary" className={`mb-4 text-${addon.color} border-${addon.color}/30`}>
                  {addon.boost}
                </Badge>
                
                <div className={`text-2xl font-orbitron font-black text-${addon.color} mb-4`}>
                  {addon.price}
                </div>
                
                <Button className={`w-full bg-${addon.color}/20 border border-${addon.color} text-${addon.color} hover:bg-${addon.color} hover:text-background transition-all duration-300`}>
                  ACTIVATE
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EliteAddOns;