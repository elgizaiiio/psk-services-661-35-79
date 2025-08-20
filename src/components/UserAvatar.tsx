import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TelegramUser } from '@/types/telegram';

interface UserAvatarProps {
  user: TelegramUser | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  showName = false,
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (!user) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage 
          src={user.photo_url} 
          alt={`${user.first_name} ${user.last_name || ''}`}
        />
        <AvatarFallback>
          {user.first_name?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      {showName && (
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {user.first_name} {user.last_name || ''}
          </p>
          {user.username && (
            <p className="text-sm text-muted-foreground truncate">
              @{user.username}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;