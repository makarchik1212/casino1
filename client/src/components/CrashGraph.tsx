import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getCrashGraphHeight } from "@/lib/game-logic";
import { useSound } from "@/contexts/SoundContext";
import crashSound from "@/assets/sounds/crash";

interface CrashGraphProps {
  multiplier: number;
  isLive: boolean;
  hasCrashed: boolean;
}

const CrashGraph = ({ multiplier, isLive, hasCrashed }: CrashGraphProps) => {
  const [height, setHeight] = useState(0);
  const animationFrameRef = useRef<number>();
  const { playSound } = useSound();
  
  // Effect to animate crash graph based on multiplier
  useEffect(() => {
    if (isLive && !hasCrashed) {
      // Animate to the target height
      const targetHeight = getCrashGraphHeight(multiplier);
      const animate = () => {
        setHeight(prevHeight => {
          const newHeight = Math.min(targetHeight, prevHeight + 0.5);
          if (newHeight < targetHeight) {
            animationFrameRef.current = requestAnimationFrame(animate);
          }
          return newHeight;
        });
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (hasCrashed) {
      // Play crash sound when game crashes
      playSound(crashSound);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [multiplier, isLive, hasCrashed]);
  
  // Reset graph when new game starts
  useEffect(() => {
    if (!isLive && !hasCrashed) {
      setHeight(0);
    }
  }, [isLive, hasCrashed]);
  
  return (
    <div className="crash-graph mb-4 bg-ui-medium rounded relative">
      <div 
        className={cn(
          "crash-line transition-all duration-100",
          hasCrashed && "bg-primary"
        )} 
        style={{ height: `${height}%` }}
      />
      
      <div className={cn(
        "text-accent font-pixel text-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        isLive && !hasCrashed && "blink"
      )}>
        {multiplier.toFixed(2)}x
      </div>
      
      {hasCrashed && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div className="bg-primary px-4 py-2 rounded font-pixel text-white animate-bounce">
            CRASHED!
          </div>
        </div>
      )}
      
      {!isLive && !hasCrashed && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div className="bg-ui-dark px-4 py-2 rounded font-pixel text-white">
            NEXT ROUND STARTING...
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGraph;
