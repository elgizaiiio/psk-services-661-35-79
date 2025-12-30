import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ endDate, compact = false }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return (
      <div className="text-destructive font-bold text-center">
        Contest Ended
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>{timeLeft.days}d {timeLeft.hours}h left</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-2xl font-bold text-primary">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-2xl font-bold text-primary">:</span>
      <TimeBlock value={timeLeft.minutes} label="Minutes" />
      <span className="text-2xl font-bold text-primary">:</span>
      <TimeBlock value={timeLeft.seconds} label="Seconds" />
    </div>
  );
};

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-2 min-w-[50px] md:min-w-[70px]">
      <span className="text-xl md:text-3xl font-bold text-primary">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs text-muted-foreground mt-1">{label}</span>
  </div>
);
