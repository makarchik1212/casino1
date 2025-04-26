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
      // Create more trails as multiplier increases
      const trailsCount = multiplier >= 5 ? 4 : 
                         multiplier >= 2 ? 2 : 1;
      
      // Create multiple trails based on multiplier
      for (let i = 0; i < trailsCount; i++) {
        // Create a new trail at the current star position with random offsets
        const createTrail = () => {
          // More random spread for higher multipliers
          const spreadFactor = Math.min(30, multiplier * 3);
          const randomOffset = () => (Math.random() * spreadFactor) - (spreadFactor / 2);
          
          const newTrail: StarTrail = {
            id: Date.now() + i,
            x: 50 + randomOffset(), // center + random offset
            y: starPosition + randomOffset(),
            size: Math.max(8, Math.min(24, multiplier * Math.random() * 3)) // Dynamic size
          };
          
          setTrails(prev => [...prev, newTrail]);
          
          // Remove trails after animation completes (staggered for visual interest)
          setTimeout(() => {
            setTrails(prev => prev.filter(trail => trail.id !== newTrail.id));
          }, 600 + Math.random() * 400); // Random duration between 600-1000ms
        };
        
        // Stagger trail creation for visual interest
        setTimeout(createTrail, i * 50);
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
          className="star-trail animate-fade-out absolute"
          style={{
            left: `${trail.x}%`,
            bottom: `${trail.y}%`,
            filter: "drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))",
            opacity: 0.8,
            transform: `rotate(${Math.random() * 360}deg)`, // Random rotation
            transition: 'all 0.5s ease-out'
          }}
        >
          <StarIcon size={trail.size} />
        </div>
      ))}
      
      {/* Flying Star Animation with Multiplier */}
      {isLive && !hasCrashed && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-out animate-pulse-slow"
          style={{ 
            bottom: `${starPosition}%`,
            filter: `drop-shadow(0 0 ${Math.min(15, 5 + multiplier/2)}px rgba(255, 215, 0, 0.8))`,
            zIndex: 10, // Ensure main star is above trails
            transform: `translate(-50%) scale(${Math.min(1.3, 1 + multiplier/25)})` // Grow slightly with multiplier
          }}
        >
          <div className="animate-spin-slow">
            <StarIcon size={32} />
          </div>
          <div 
            className="absolute top-0 left-full ml-2 font-pixel text-white bg-ui-dark bg-opacity-70 px-2 py-1 rounded text-lg whitespace-nowrap"
            style={{
              borderLeft: multiplier >= 2 ? '2px solid #FFD700' : 'none',
              boxShadow: multiplier >= 3 ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
            }}
          >
            <span className={multiplier >= 2 ? 'text-accent' : 'text-white'}>
              {multiplier.toFixed(2)}x
            </span>
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
