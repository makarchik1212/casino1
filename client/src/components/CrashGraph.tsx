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
  const [countdown, setCountdown] = useState<number>(10); // Счетчик для отсчета 10 секунд
  const animationFrameRef = useRef<number>();
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
          // Faster height animation for more dramatic effect
          const newHeight = Math.min(targetHeight, prevHeight + 0.8);
          if (newHeight < targetHeight) {
            animationFrameRef.current = requestAnimationFrame(animate);
          }
          return newHeight;
        });
        
        // Update star position to move up from bottom (100%) to center (50%)
        setStarPosition(prev => {
          // Configure star to start from bottom (100%) and move to center (50%)
          // Star stops at the center (50%) regardless of multiplier value
          const center = 50;
          const startPos = 100;
          
          // Value between 0 and 1 representing progress toward target
          // Use eased movement for smoother animation
          const progressFactor = Math.min(1, (multiplier - 1) * 0.4); // Slower movement to center
          
          // Calculate new position with easing
          const easing = 1 - Math.pow(1 - progressFactor, 3); // Cubic easing
          const newPosition = startPos - (startPos - center) * easing;
          
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
  
  // Управление обратным отсчетом только между играми, а не после краша
  useEffect(() => {
    // Только когда идет между игр (!isLive && !hasCrashed)
    if (!isLive && !hasCrashed) {
      // Сбрасываем высоту графика
      setHeight(0);
      setStarPosition(100); // Reset star to bottom
      
      // Запустить обратный отсчет времени до следующей игры
      setCountdown(10); // Сбросить счетчик при начале нового отсчета
      
      // Очистить предыдущий интервал, если он существует
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      
      // Запустить новый интервал для обратного отсчета
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Остановить обратный отсчет, когда он достигнет 0
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Очистка при размонтировании
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
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
      
      {/* Flying Star Animation with Multiplier directly on the star */}
      {isLive && !hasCrashed && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-out animate-pulse-slow"
          style={{ 
            bottom: `${Math.min(50, starPosition)}%`, // Max at 50% height (center of screen)
            filter: `drop-shadow(0 0 ${Math.min(15, 5 + multiplier/2)}px rgba(255, 215, 0, 0.8))`,
            zIndex: 10, // Ensure main star is above trails
            transform: `translate(-50%) scale(${Math.min(1.3, 1 + multiplier/25)})` // Grow slightly with multiplier
          }}
        >
          <div className="relative flex flex-col items-center">
            <div className="animate-spin-slow">
              <StarIcon size={38} />
            </div>
            
            {/* Удален черный коэффициент на звезде */}
            
            {/* Возвращаем желтый коэффициент под звездой */}
            <div 
              className="mt-1 font-pixel text-accent bg-ui-dark bg-opacity-80 px-2 py-1 rounded whitespace-nowrap"
              style={{
                borderLeft: multiplier >= 2 ? '2px solid #FFD700' : 'none',
                boxShadow: multiplier >= 3 ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none',
                fontSize: multiplier >= 2 ? '18px' : '16px'
              }}
            >
              <span className="text-accent">
                {multiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Большой коэффициент отображается вместе со звездой, поэтому здесь он не нужен */}
      
      {hasCrashed && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <div className="bg-primary px-4 py-2 rounded font-pixel text-white animate-bounce">
            CRASHED!
          </div>
        </div>
      )}
      
      {!isLive && !hasCrashed && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <div className="bg-ui-dark px-6 py-3 rounded-lg font-pixel text-white text-center mb-2">
            <div className="mb-1 text-accent animate-pulse-slow">PLACE YOUR BETS NOW!</div>
            <div className="text-sm">NEXT ROUND STARTING IN</div>
            
            {/* Таймер обратного отсчета с анимацией */}
            <div className="mt-2 text-3xl font-pixel relative">
              <span className="animate-timer">{countdown}</span>
              <span className="text-sm ml-1 text-accent">s</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-ui-dark bg-opacity-80 px-4 py-2 rounded-lg mt-2">
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGraph;
