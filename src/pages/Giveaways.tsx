import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoltIcon from '@/components/ui/bolt-icon';
import { 
  Hand, 
  Users, 
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Giveaway {
  id: number;
  title: string;
  itemName: string;
  itemImage: string;
  handEmoji: string;
  handsCount: number;
  maxParticipants: number;
  isUnlimited: boolean;
  status: 'active' | 'finished';
  timeLeft?: string;
}

const Giveaways: React.FC = () => {
  const [activeGiveaways] = useState<Giveaway[]>([
    {
      id: 63,
      title: 'Giveaway #63',
      itemName: 'Vintage Cigar #14117',
      itemImage: '/lovable-uploads/f9492cb1-017f-4d7f-9a82-3195d63ff297.png',
      handEmoji: '👋',
      handsCount: 2,
      maxParticipants: 1000,
      isUnlimited: false,
      status: 'active',
      timeLeft: '2 days left'
    },
    {
      id: 54,
      title: 'Giveaway #54',
      itemName: 'Vintage Cigar #15382',
      itemImage: '/lovable-uploads/f9492cb1-017f-4d7f-9a82-3195d63ff297.png',
      handEmoji: '👋',
      handsCount: 5,
      maxParticipants: 400,
      isUnlimited: false,
      status: 'active',
      timeLeft: '5 hours left'
    }
  ]);

  const [finishedGiveaways] = useState<Giveaway[]>([
    {
      id: 45,
      title: 'Giveaway #45',
      itemName: 'Special Item #12345',
      itemImage: '/lovable-uploads/f9492cb1-017f-4d7f-9a82-3195d63ff297.png',
      handEmoji: '👋',
      handsCount: 10,
      maxParticipants: 500,
      isUnlimited: false,
      status: 'finished'
    }
  ]);

  const handleGiveMe = (giveawayId: number, handsCount: number) => {
    toast.success(`Successfully raised ${handsCount} hands for giveaway #${giveawayId}!`);
  };

  const formatParticipants = (current: number, max: number, isUnlimited: boolean) => {
    if (isUnlimited) {
      return `${current} / ∞`;
    }
    return `${current} / ${max}`;
  };

  const GiveawayCard = ({ giveaway }: { giveaway: Giveaway }) => (
    <Card className="p-6 bg-card border-border rounded-2xl">
      <div className="flex items-start justify-between mb-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-border">
          <img 
            src={giveaway.itemImage} 
            alt={giveaway.itemName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 mr-4">
          <h3 className="text-2xl font-bold text-foreground mb-2">{giveaway.title}</h3>
          <p className="text-muted-foreground text-base mb-3">{giveaway.itemName}</p>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Participants: {formatParticipants(27, giveaway.maxParticipants, giveaway.isUnlimited)}</span>
            </div>
            {giveaway.timeLeft && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Time Left: {giveaway.timeLeft}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-full flex items-center gap-3 text-lg w-full"
          onClick={() => handleGiveMe(giveaway.id, giveaway.handsCount)}
        >
          <span className="text-xl">{giveaway.handEmoji}</span>
          Give me {giveaway.handsCount}
        </Button>
      </div>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Giveaways | Win Amazing Prizes</title>
        <meta name="description" content="Participate in giveaways and win amazing prizes" />
        <link rel="canonical" href="/giveaways" />
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          
          {/* Header with User and Hands */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Avatar className="w-14 h-14 ring-2 ring-border">
                <AvatarImage src="/lovable-uploads/f9492cb1-017f-4d7f-9a82-3195d63ff297.png" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <BoltIcon size="md" />
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold text-foreground">elgiza</h1>
            </div>
            
            <div className="bg-primary/10 border border-border rounded-full px-4 py-2 flex items-center gap-2">
              <Hand className="w-5 h-5 text-primary" />
              <span className="text-primary font-bold text-lg">0</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Giveaways</h2>
            <p className="text-muted-foreground text-sm">Participate in giveaways and win amazing prizes</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted border border-border">
              <TabsTrigger 
                value="active" 
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Active
              </TabsTrigger>
              <TabsTrigger 
                value="finished"
                className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Finished
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6 space-y-4">
              {activeGiveaways.map((giveaway) => (
                <GiveawayCard key={giveaway.id} giveaway={giveaway} />
              ))}
            </TabsContent>

            <TabsContent value="finished" className="mt-6 space-y-4">
              {finishedGiveaways.map((giveaway) => (
                <GiveawayCard key={giveaway.id} giveaway={giveaway} />
              ))}
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  );
};

export default Giveaways;
