import { SVGProps } from "react";

interface CoinIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const CoinIcon = ({ size = 24, className, ...props }: CoinIconProps) => {
  return (
    <div 
      className={`coin-sprite ${className || ""}`} 
      style={{ 
        width: size, 
        height: size,
        display: "inline-block",
        backgroundColor: "hsl(var(--accent))",
        borderRadius: "50%",
        position: "relative"
      }}
      {...props}
    >
      <style jsx>{`
        .coin-sprite::after {
          content: "$";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: ${size * 0.6}px;
          color: hsl(var(--background));
          font-family: 'Press Start 2P', cursive;
        }
      `}</style>
    </div>
  );
};

export default CoinIcon;
