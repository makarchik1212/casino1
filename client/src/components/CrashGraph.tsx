import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getCrashGraphHeight } from "@/lib/game-logic";
import { useSound } from "@/contexts/SoundContext";
import crashSound from "@/assets/sounds/crash";
import StarIcon from "@/assets/icons/StarIcon";

interface CrashGraphProps {
  multiplier: number;
  isLive: boolean;
  hasCrashed: boolean;
}

interface StarTrail {
  id: number;
  x: number;
  y: number;
  size: number;
}

const CrashGraph = ({ multiplier, isLive, hasCrashed }: CrashGraphProps) => {
  const [height, setHeight] = useState(0);
  const [starPosition, setStarPosition] = useState(100); // Position from the bottom (%)
  const [trails, setTrails] = useState<StarTrail[]>([]);
  const animationFrameRef = useRef<number>();
  const prevMultiplierRef = useRef(1);
  const { playSound } = useSound();
  
  // Effect to create star trails when multiplier increases
  useEffect(() => {
    if (isLive && !hasCrashed && multiplier > prevMultiplierRef.current) {
      // Only add trails when multiplier increases
      if (multiplier >= 1.5) {
        // Create a new trail at the current star position
        const randomOffset = () => Math.random() * 10 - 5;
        const newTrail: StarTrail = {
          id: Date.now(),
          x: 50 + randomOffset(), // center + small random offset
          y: starPosition + randomOffset(),
          size: Math.max(8, Math.min(20, multiplier * 2)) // Size based on multiplier, between 8-20px
        };
        
        setTrails(prev => [...prev, newTrail]);
        
        // Remove trails after animation completes
        setTimeout(() => {
          setTrails(prev => prev.filter(trail => trail.id !== newTrail.id));
        }, 800); // Match with CSS animation duration
      }
      
      // Update reference
      prevMultiplierRef.current = multiplier;
    }
  }, [multiplier, isLive, hasCrashed, starPosition]);
  
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
        
        // Update star position to move up with the increasing multiplier
        setStarPosition(prev => {
          // Star moves from bottom (100%) to top (0%) as multiplier increases
          const newPosition = Math.max(0, 100 - (multiplier - 1) * 10);
          return newPosition;
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
      setStarPosition(100); // Reset star to bottom
    }
  }, [isLive, hasCrashed]);
  
  return (
    <div className="crash-graph mb-4 bg-ui-medium rounded relative overflow-hidden">
      <div 
        className={cn(
          "crash-line transition-all duration-100",
          hasCrashed && "bg-primary"
        )} 
        style={{ height: `${height}%` }}
      />
      
      {/* Star Trails */}
      {trails.map(trail => (
        <div 
          key={trail.id}
          className="star-trail"
          style={{
            left: `${trail.x}%`,
            bottom: `${trail.y}%`,
            filter: "drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))"
          }}
        >
          <StarIcon size={trail.size} />
        </div>
      ))}
      
      {/* Flying Star Animation with Multiplier */}
      {isLive && !hasCrashed && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-100"
          style={{ 
            bottom: `${starPosition}%`,
            filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.7))",
            zIndex: 10 // Ensure main star is above trails
          }}
        >
          <StarIcon size={32} />
          <div className="absolute top-0 left-full ml-2 font-pixel text-white bg-ui-dark bg-opacity-70 px-2 py-1 rounded text-lg whitespace-nowrap">
            {multiplier.toFixed(2)}x
          </div>
        </div>
      )}
      
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
