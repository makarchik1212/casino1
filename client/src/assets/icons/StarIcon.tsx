import { HTMLProps } from "react";

interface StarIconProps extends HTMLProps<HTMLDivElement> {
  size?: number;
}

const StarIcon = ({ size = 24, className, ...props }: StarIconProps) => {
  return (
    <div 
      className={`star-sprite ${className || ""}`} 
      style={{ 
        width: size, 
        height: size,
        display: "inline-block",
        position: "relative"
      }}
      {...props}
    >
      <style>{`
        .star-sprite {
          position: relative;
          display: inline-block;
          color: hsl(var(--accent));
          transform-origin: center;
          animation: star-spin 4s linear infinite;
        }
        
        @keyframes star-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .star-sprite::before {
          content: "★";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: ${size}px;
          line-height: 1;
        }
      `}</style>
    </div>
  );
};

export default StarIcon;