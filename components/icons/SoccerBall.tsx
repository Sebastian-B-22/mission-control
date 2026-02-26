import { SVGProps } from "react";

interface SoccerBallProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export function SoccerBall({ className, ...props }: SoccerBallProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Pentagon pattern - classic soccer ball look */}
      {/* Center hexagon */}
      <polygon 
        points="12,8 14.5,10 13.5,13 10.5,13 9.5,10" 
        fill="currentColor" 
        stroke="currentColor"
      />
      {/* Top */}
      <line x1="12" y1="2" x2="12" y2="8" />
      {/* Top right */}
      <line x1="21" y1="9" x2="14.5" y2="10" />
      {/* Bottom right */}  
      <line x1="18" y1="19" x2="13.5" y2="13" />
      {/* Bottom left */}
      <line x1="6" y1="19" x2="10.5" y2="13" />
      {/* Top left */}
      <line x1="3" y1="9" x2="9.5" y2="10" />
    </svg>
  );
}
