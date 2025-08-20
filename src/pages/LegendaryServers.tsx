import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Battery, HardDrive, Thermometer, Shield, Crown, Star, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LegendaryServers = () => {
  const navigate = useNavigate();

  const serverTiers = [
    {
      name: 'Basic Miner',
      tier: 'Basic',
      color: 'neon-blue',
      icon: Zap,
      hashRate: '50 TH/s',
      battery: '24h',
      storage: '1TB',
      heat: 'Standard',
      reliability: '95%',
      price: '$29',
      description: 'Perfect for beginners starting their mining journey'
    },
    {
      name: 'Pro Rig',
      tier: 'Pro',
      color: 'neon-green',
      icon: Battery,
      hashRate: '150 TH/s',
      battery: '48h',
      storage: '5TB',
      heat: 'Advanced',
      reliability: '98%',
      price: '$99',
      description: 'Professional-grade mining for serious miners'
    },
    {
      name: 'Legendary Beast',
      tier: 'Legendary',
      color: 'neon-purple',
      icon: Crown,
      hashRate: '500 TH/s',
      battery: '72h',
      storage: '20TB',
      heat: 'Quantum',
      reliability: '99.5%',
      price: '$299',
      description: 'Elite mining power for the top 1%'
    },
    {
      name: 'Mythic Dragon',
      tier: 'Mythic',
      color: 'neon-orange',
      icon: Flame,
      hashRate: '1500 TH/s',
      battery: '168h',
      storage: '100TB',
      heat: 'Zero-Point',
      reliability: '99.9%',
      price: '$999',
      description: 'Ultimate mining supremacy'
    },
    {
      name: 'Cosmic Destroyer',
      tier: 'Cosmic',
      color: 'neon-pink',
      icon: Star,
      hashRate: '5000 TH/s',
      battery: '720h',
      storage: '1PB',
      heat: 'Absolute Zero',
      reliability: '99.99%',
      price: '$2999',
      description: 'Beyond legendary - cosmic power'
    },
    {
      name: 'Quantum God',
      tier: 'Divine',
      color: 'neon-cyan',
      icon: Crown,
      hashRate: '∞ TH/s',
      battery: '∞',
      storage: '∞',
      heat: 'None',
      reliability: '100%',
      price: '$9999',
      description: 'Transcend reality itself'
    }
  ];

  return (
    <div className="min-h-screen text-foreground font-rajdhani">
      <Helmet>
        <title>Legendary Servers | Choose Your Weapon</title>
        <meta name="description" content="Choose your weapon. From basic miners to mythic dragons." />
      </Helmet>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-orbitron font-black bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
              LEGENDARY SERVERS
            </h1>
            <p className="text-muted-foreground">Choose your weapon. From basic miners to mythic dragons.</p>
          </div>
        </div>

        {/* Comparison Table Header */}
        <Card className="mb-6 border border-neon-blue/20 bg-gradient-to-r from-neon-blue/5 to-background">
          <CardContent className="p-6">
            <h2 className="text-2xl font-orbitron font-bold mb-4 text-center text-neon-blue">Server Comparison Matrix</h2>
            <div className="grid grid-cols-5 gap-2 text-sm font-bold text-center">
              <div>Hash Rate</div>
              <div>Battery Life</div>
              <div>Storage</div>
              <div>Heat Management</div>
              <div>Reliability</div>
            </div>
          </CardContent>
        </Card>

        {/* Servers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serverTiers.map((server, index) => (
            <Card 
              key={server.name} 
              className={`relative overflow-hidden border-2 border-${server.color}/30 bg-gradient-to-br from-card/50 to-background hover:border-${server.color} transition-all duration-500 group animate-fade-in ${server.tier === 'Divine' ? 'animate-neon-pulse' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-${server.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {server.tier === 'Divine' && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-neon-cyan text-background animate-pulse">DIVINE</Badge>
                </div>
              )}
              
              <CardContent className="p-6 relative z-10">
                <div className="text-center mb-6">
                  <Badge variant="secondary" className={`mb-3 text-${server.color} border-${server.color}/30`}>
                    {server.tier}
                  </Badge>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-${server.color}/10 flex items-center justify-center border border-${server.color}/30`}>
                    <server.icon className={`w-8 h-8 text-${server.color}`} />
                  </div>
                  <h3 className="text-xl font-orbitron font-bold mb-2">{server.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{server.description}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-neon-blue" />
                      Hash Rate
                    </span>
                    <span className="font-bold text-neon-blue">{server.hashRate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-neon-green" />
                      Battery
                    </span>
                    <span className="font-bold text-neon-green">{server.battery}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-neon-purple" />
                      Storage
                    </span>
                    <span className="font-bold text-neon-purple">{server.storage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-neon-orange" />
                      Heat Mgmt
                    </span>
                    <span className="font-bold text-neon-orange">{server.heat}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-neon-pink" />
                      Reliability
                    </span>
                    <span className="font-bold text-neon-pink">{server.reliability}</span>
                  </div>
                </div>

                <div className={`text-center py-4 my-4 border-t border-${server.color}/20`}>
                  <div className={`text-3xl font-orbitron font-black text-${server.color}`}>
                    {server.price}
                  </div>
                  <div className="text-xs text-muted-foreground">One-time purchase</div>
                </div>

                <Button className={`w-full bg-${server.color}/20 border border-${server.color} text-${server.color} hover:bg-${server.color} hover:text-background transition-all duration-300`}>
                  {server.tier === 'Divine' ? 'ASCEND TO GODHOOD' : `BUY ${server.tier.toUpperCase()}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegendaryServers;