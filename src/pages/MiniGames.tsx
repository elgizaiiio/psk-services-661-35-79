import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const MiniGames: React.FC = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'arcade',
      title: 'Arcade Games',
      description: 'العب 50+ لعبة خارجية!',
      path: '/arcade',
      reward: '30+',
      emoji: '🕹️'
    },
    {
      id: 'spin-wheel',
      title: 'عجلة الحظ',
      description: 'دوّر واربح جوائز!',
      path: '/spin-wheel',
      reward: '1,000+',
      emoji: '🎡'
    },
    {
      id: 'coin-flip',
      title: 'قلب العملة',
      description: 'ضاعف رصيدك!',
      path: '/coin-flip',
      reward: '2x',
      emoji: '🪙'
    },
    {
      id: 'dice',
      title: 'لعبة النرد',
      description: 'خمّن واربح 5x!',
      path: '/dice-game',
      reward: '5x',
      emoji: '🎲'
    },
    {
      id: 'memory',
      title: 'لعبة الذاكرة',
      description: 'اختبر ذاكرتك!',
      path: '/memory-game',
      reward: '150+',
      emoji: '🧠'
    },
    {
      id: 'slots',
      title: 'Slots',
      description: 'Spin & win coins!',
      path: '/slots',
      reward: '1,000+',
      emoji: '🎰'
    },
    {
      id: '2048',
      title: '2048 Game',
      description: 'Classic puzzle game',
      path: '/game',
      reward: '500+',
      emoji: '🧩'
    },
    {
      id: 'challenges',
      title: 'Challenges',
      description: 'Complete challenges',
      path: '/challenges',
      reward: '2,000+',
      emoji: '🏆'
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Mini Games | Bolt Platform</title>
        <meta name="description" content="Play mini games and earn Bolt coins" />
        <link rel="canonical" href={`${window.location.origin}/mini-games`} />
      </Helmet>

      {/* Header */}
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Mini Games</h1>
        <p className="text-muted-foreground">Play games & earn rewards</p>
      </div>

      {/* Stats Bar */}
      <div className="px-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-primary">{games.length}</p>
              <p className="text-xs text-muted-foreground">Games</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-foreground">∞</p>
              <p className="text-xs text-muted-foreground">Free Plays</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-primary">5,000+</p>
              <p className="text-xs text-muted-foreground">Max Reward</p>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="px-6 space-y-4">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => navigate(game.path)}
            className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                  {game.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{game.title}</h3>
                  <p className="text-sm text-muted-foreground">{game.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary font-bold">{game.reward}</p>
                <p className="text-xs text-muted-foreground">BOLT</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Bonus Card */}
      <div className="px-6 mt-6">
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Daily Bonus</h3>
              <p className="text-sm text-muted-foreground">Play any game for extra rewards</p>
            </div>
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold">
              +50%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGames;
