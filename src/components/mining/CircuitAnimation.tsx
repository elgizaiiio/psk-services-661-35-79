import React from 'react';

interface CircuitAnimationProps {
  className?: string;
}

const CircuitAnimation: React.FC<CircuitAnimationProps> = ({ className = '' }) => {
  return (
    <div className={`circuit-container ${className}`}>
      <svg viewBox="0 0 300 120" className="w-full h-auto">
        {/* Background traces */}
        <g className="trace-bg">
          {/* Left traces */}
          <path d="M 0 30 H 80 L 100 50" />
          <path d="M 0 60 H 70 L 100 60" />
          <path d="M 0 90 H 80 L 100 70" />
          
          {/* Right traces */}
          <path d="M 300 30 H 220 L 200 50" />
          <path d="M 300 60 H 230 L 200 60" />
          <path d="M 300 90 H 220 L 200 70" />
          
          {/* Top and bottom traces */}
          <path d="M 130 0 V 30 L 150 45" />
          <path d="M 170 0 V 30 L 150 45" />
          <path d="M 130 120 V 90 L 150 75" />
          <path d="M 170 120 V 90 L 150 75" />
        </g>

        {/* Animated flow traces */}
        <g>
          <path d="M 0 30 H 80 L 100 50" className="trace-flow trace-blue" style={{ animationDelay: '0s' }} />
          <path d="M 0 60 H 70 L 100 60" className="trace-flow trace-emerald" style={{ animationDelay: '0.5s' }} />
          <path d="M 0 90 H 80 L 100 70" className="trace-flow trace-violet" style={{ animationDelay: '1s' }} />
          
          <path d="M 300 30 H 220 L 200 50" className="trace-flow trace-amber" style={{ animationDelay: '0.3s' }} />
          <path d="M 300 60 H 230 L 200 60" className="trace-flow trace-blue" style={{ animationDelay: '0.8s' }} />
          <path d="M 300 90 H 220 L 200 70" className="trace-flow trace-fuchsia" style={{ animationDelay: '1.3s' }} />
          
          <path d="M 130 0 V 30 L 150 45" className="trace-flow trace-emerald" style={{ animationDelay: '0.2s' }} />
          <path d="M 170 0 V 30 L 150 45" className="trace-flow trace-violet" style={{ animationDelay: '0.7s' }} />
          <path d="M 130 120 V 90 L 150 75" className="trace-flow trace-amber" style={{ animationDelay: '1.1s' }} />
          <path d="M 170 120 V 90 L 150 75" className="trace-flow trace-blue" style={{ animationDelay: '1.6s' }} />
        </g>

        {/* Central chip */}
        <g>
          {/* Chip pins */}
          <rect x="95" y="48" width="10" height="4" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="95" y="58" width="10" height="4" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="95" y="68" width="10" height="4" className="chip-pin" fill="hsl(var(--muted))" />
          
          <rect x="195" y="48" width="10" height="4" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="195" y="58" width="10" height="4" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="195" y="68" width="10" height="4" className="chip-pin" fill="hsl(var(--muted))" />
          
          <rect x="128" y="40" width="4" height="10" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="148" y="40" width="4" height="10" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="168" y="40" width="4" height="10" className="chip-pin" fill="hsl(var(--muted))" />
          
          <rect x="128" y="70" width="4" height="10" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="148" y="70" width="4" height="10" className="chip-pin" fill="hsl(var(--muted))" />
          <rect x="168" y="70" width="4" height="10" className="chip-pin" fill="hsl(var(--muted))" />
          
          {/* Chip body */}
          <rect 
            x="105" y="45" 
            width="90" height="30" 
            rx="6" ry="6"
            fill="hsl(var(--secondary))"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          
          {/* Chip text */}
          <text 
            x="150" y="65" 
            textAnchor="middle" 
            className="chip-text"
            fill="hsl(var(--primary))"
            fontSize="12"
          >
            BOLT
          </text>
        </g>

        {/* Corner decorations */}
        <circle cx="20" cy="20" r="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
        <circle cx="280" cy="20" r="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
        <circle cx="20" cy="100" r="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
        <circle cx="280" cy="100" r="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
      </svg>
    </div>
  );
};

export default CircuitAnimation;
