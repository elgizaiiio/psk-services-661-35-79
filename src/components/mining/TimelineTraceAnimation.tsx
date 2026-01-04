import React from 'react';

interface TimelineTraceAnimationProps {
  serverCount: number;
  ownedCount: number;
  nodeHeight?: number;
  nodeGap?: number;
}

const TimelineTraceAnimation: React.FC<TimelineTraceAnimationProps> = ({ 
  serverCount, 
  ownedCount,
  nodeHeight = 120,
  nodeGap = 12
}) => {
  const totalHeight = serverCount * nodeHeight + (serverCount - 1) * nodeGap;
  const progressHeight = ownedCount > 0 
    ? (ownedCount * nodeHeight + (ownedCount - 1) * nodeGap) 
    : 0;

  // Generate node positions
  const nodePositions = Array.from({ length: serverCount }, (_, i) => 
    i * (nodeHeight + nodeGap) + nodeHeight / 2
  );

  return (
    <div className="absolute left-[11px] top-0 bottom-0 w-8 pointer-events-none overflow-hidden">
      <svg 
        viewBox={`0 0 32 ${totalHeight}`} 
        className="w-full h-full"
        preserveAspectRatio="none"
        style={{ height: totalHeight }}
      >
        {/* Background trace line */}
        <line 
          x1="16" y1="0" 
          x2="16" y2={totalHeight}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          opacity="0.3"
        />

        {/* Progress glow line */}
        {progressHeight > 0 && (
          <line 
            x1="16" y1="0" 
            x2="16" y2={progressHeight}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            className="timeline-progress-glow"
          />
        )}

        {/* Animated flowing traces */}
        <g className="flowing-traces">
          {/* Blue trace */}
          <line 
            x1="16" y1="0" 
            x2="16" y2={totalHeight}
            className="trace-flow-vertical trace-blue"
            style={{ animationDelay: '0s' }}
          />
          
          {/* Emerald trace */}
          <line 
            x1="16" y1="0" 
            x2="16" y2={totalHeight}
            className="trace-flow-vertical trace-emerald"
            style={{ animationDelay: '0.8s' }}
          />
          
          {/* Violet trace */}
          <line 
            x1="16" y1="0" 
            x2="16" y2={totalHeight}
            className="trace-flow-vertical trace-violet"
            style={{ animationDelay: '1.6s' }}
          />
          
          {/* Amber trace */}
          <line 
            x1="16" y1="0" 
            x2="16" y2={totalHeight}
            className="trace-flow-vertical trace-amber"
            style={{ animationDelay: '2.4s' }}
          />
          
          {/* Fuchsia trace */}
          <line 
            x1="16" y1="0" 
            x2="16" y2={totalHeight}
            className="trace-flow-vertical trace-fuchsia"
            style={{ animationDelay: '3.2s' }}
          />
        </g>

        {/* Node glow points */}
        {nodePositions.map((y, index) => (
          <g key={index}>
            {/* Outer glow */}
            <circle
              cx="16"
              cy={y}
              r={index < ownedCount ? 8 : 4}
              fill="none"
              stroke={index < ownedCount ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth="1"
              opacity={index < ownedCount ? 0.5 : 0.3}
              className={index < ownedCount ? "node-pulse" : ""}
            />
            
            {/* Inner point */}
            <circle
              cx="16"
              cy={y}
              r={index < ownedCount ? 4 : 2}
              fill={index < ownedCount ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              opacity={index < ownedCount ? 1 : 0.5}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default TimelineTraceAnimation;
