import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, Wallet, Trophy } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';

const UserProfileButton: React.FC = () => {
  const navigate = useNavigate();
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { user } = useViralMining(tgUser);
  
  const handleMenuClick = (path: string) => {
    hapticFeedback.impact('light');
    navigate(path);
  };
  
  return (
    <div style={{ paddingTop: 'var(--tg-safe-area-inset-top, 0px)' }} className="fixed top-4 right-4 z-50 py-[39px]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-12 h-12 rounded-full p-0 bg-primary/10 border border-border hover:bg-primary/20 transition-all duration-300">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.photo_url || tgUser?.photo_url} alt={user?.first_name || tgUser?.first_name} />
              <AvatarFallback className="bg-primary/20 text-primary">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" side="top" className="w-56 mb-2 bg-card border-border z-50">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                <AvatarImage src={user?.photo_url || tgUser?.photo_url} alt={user?.first_name || tgUser?.first_name} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {(user?.first_name || tgUser?.first_name)?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary truncate">
                  {user?.first_name || tgUser?.first_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{tgUser?.username || 'username'}
                </p>
                {user?.token_balance && (
                  <p className="text-xs text-primary font-medium">
                    {user.token_balance.toFixed(2)} BOLT
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenuItem onClick={() => handleMenuClick('/profile')} className="cursor-pointer hover:bg-primary/10 transition-colors">
            <User className="w-4 h-4 mr-2 text-primary" />
            My Profile
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleMenuClick('/wallet')} className="cursor-pointer hover:bg-primary/10 transition-colors">
            <Wallet className="w-4 h-4 mr-2 text-primary" />
            Wallet & Balance
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleMenuClick('/leaderboard')} className="cursor-pointer hover:bg-primary/10 transition-colors">
            <Trophy className="w-4 h-4 mr-2 text-primary" />
            Leaderboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfileButton;
