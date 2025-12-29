
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ExternalLink, Check, Sparkles } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  points: number;
  task_url?: string | null;
  category: string;
}

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, isCompleted }) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 border-none bg-primary/5 backdrop-blur-none rounded-xl">
      <div className="flex items-center gap-4">
        {/* Task Image/Icon */}
        <div className="w-12 h-12 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
          {task.image_url ? (
            <img 
              src={task.image_url} 
              alt={task.title}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <Coins className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 text-white">
              {task.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-white/90">
              <img 
                src="/lovable-uploads/bb2ce9b7-afd0-4e2c-8447-351c0ae1f27d.png" 
                alt="Bolt Icon" 
                className="w-3 h-3"
              />
              +{task.points} BOLT
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex-shrink-0">
            {isCompleted ? (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : (
              <Button 
                variant="default"
                size="sm" 
                className="w-20 h-8 text-xs bg-primary hover:bg-primary/90 text-white rounded-lg" 
                onClick={onComplete}
              >
                Start
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
