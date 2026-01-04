import React from 'react';

interface TimelineTraceAnimationProps {
  serverCount: number;
  ownedCount: number;
}

const TimelineTraceAnimation: React.FC<TimelineTraceAnimationProps> = ({ 
  serverCount, 
  ownedCount
}) => {
  return (
    <div className="absolute left-[11px] top-0 bottom-0 w-[3px] pointer-events-none">
      {/* Background line */}
      <div className="absolute inset-0 bg-border/30 rounded-full" />
      
      {/* Progress line */}
      {ownedCount > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
          style={{ height: `${(ownedCount / serverCount) * 100}%` }}
        />
      )}
      
      {/* Simple flowing dot */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="timeline-flow-dot" />
      </div>
    </div>
  );
};

export default TimelineTraceAnimation;
