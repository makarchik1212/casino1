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
  waitingForBets?: boolean;
  waitingCountdown?: number;
}

interface StarTrail {
  id: number;
  x: number;
  y: number;
  size: number;
}

const CrashGraph = ({ multiplier, isLive, hasCrashed, waitingForBets, waitingCountdown }: CrashGraphProps) => {
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
    <div className="crash-graph mb-4 bg-ui-medium rounded-md relative overflow-hidden border border-ui-dark">
      {/* Сетка фона для графика */}
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 opacity-20 pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="border border-white/10"></div>
        ))}
      </div>
      
      {/* Дополнительный градиент для фона */}
      <div className="absolute inset-0 bg-gradient-to-tr from-ui-dark/40 to-transparent"></div>
      
      {/* Линия графика с более плавной анимацией и градиентом */}
      <div 
        className={cn(
          "crash-line transition-all duration-300 ease-out",
          hasCrashed ? "bg-crash-line-crashed" : "bg-crash-line"
        )} 
        style={{ 
          height: `${height}%`,
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
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
      
      {/* Rocket/Star Animation (Cobalt Lab style) */}
      {isLive && !hasCrashed && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-200"
          style={{ 
            bottom: `${Math.min(50, starPosition)}%`, // Max at 50% height (center of screen)
            filter: `drop-shadow(0 0 ${Math.min(20, 5 + multiplier/2)}px rgba(255, 215, 0, 0.7))`,
            zIndex: 10, // Ensure star is above graph line
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Main star with glow effect - larger and more dramatic */}
            <div 
              className="animate-spin-slow relative"
              style={{
                transform: `scale(${Math.min(1.5, 1 + multiplier/15)})`, // Grow more dramatically with multiplier
              }}
            >
              <div className="absolute -inset-1 bg-accent rounded-full opacity-20 animate-pulse-slow blur-md"></div>
              <StarIcon size={45} />
              
              {/* Spark/trail effects */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-80">
                <div className="w-1 h-6 bg-gradient-to-t from-accent to-transparent rounded-full"></div>
              </div>
            </div>
            
            {/* Coefficient display - more stylized and modern */}
            <div 
              className="mt-3 font-pixel text-accent bg-ui-dark bg-opacity-90 px-3 py-1.5 rounded-md whitespace-nowrap border border-accent/30"
              style={{
                boxShadow: multiplier >= 2 ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none',
                fontSize: Math.min(24, 16 + (multiplier / 2)) + 'px', // Dynamic sizing based on multiplier
                transform: multiplier >= 3 ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s'
              }}
            >
              <span className={multiplier >= 2 ? "text-accent font-bold" : "text-accent"}>
                {multiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Большой коэффициент отображается вместе со звездой, поэтому здесь он не нужен */}
      
      {/* Enhanced Crash Effect with Explosions (Cobalt Lab style) */}
      {hasCrashed && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          {/* Main crash message with explosion effects */}
          <div className="relative">
            {/* Background glow/explosion */}
            <div className="absolute inset-0 bg-primary rounded-full animate-pulse opacity-70 blur-xl" 
                style={{ transform: 'scale(2)' }}></div>
                
            {/* Explosion particles - more dynamic with random sizes and directions */}
            {Array.from({length: 12}).map((_, i) => {
              // Create random directions for particles
              const angle = Math.random() * 360;
              const distance = 30 + Math.random() * 70;
              const size = 2 + Math.random() * 3;
              const delay = Math.random() * 0.2;
              
              // Assign random custom properties for the animation
              const style = {
                '--x': `${Math.cos(angle * (Math.PI/180)) * distance}px`,
                '--y': `${Math.sin(angle * (Math.PI/180)) * distance}px`,
              } as React.CSSProperties;
              
              return (
                <div 
                  key={i}
                  className="absolute bg-accent rounded-full animate-explosion-particle" 
                  style={{
                    left: '50%',
                    top: '50%',
                    width: `${size}px`,
                    height: `${size}px`,
                    opacity: 0.8,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${delay}s`,
                    ...style
                  }}
                ></div>
              );
            })}
            
            {/* Main crash text */}
            <div className="bg-primary px-6 py-3 rounded-lg font-pixel text-white z-20 relative animate-shake">
              <span className="text-xl font-bold">CRASHED!</span>
              <span className="block text-2xl font-bold">{multiplier.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Улучшенный таймер в стиле Cobalt Lab */}
      {!isLive && !hasCrashed && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <div className="bg-cobalt-gradient border-gold px-8 py-4 rounded-lg font-pixel text-white text-center mb-2">
            {/* Верхняя часть с мигающими огнями */}
            <div className="flex justify-center items-center mb-2">
              <div className="w-2 h-2 bg-danger rounded-full animate-pulse-soft mr-2"></div>
              <div className="text-accent font-bold text-lg animate-pulse-slow tracking-wider">PLACE YOUR BETS</div>
              <div className="w-2 h-2 bg-danger rounded-full animate-pulse-soft ml-2"></div>
            </div>
            
            {/* Линия разделитель */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent my-2"></div>
            
            <div className="text-sm text-white/80 uppercase tracking-wide">NEXT ROUND IN</div>
            
            {/* Таймер обратного отсчета с улучшенной анимацией */}
            <div className="mt-3 flex items-center justify-center">
              <div className="relative flex items-center">
                {/* Круглая подложка для таймера */}
                <div className="absolute inset-0 bg-accent/10 rounded-full animate-pulse-soft" 
                     style={{ transform: 'scale(1.3)' }}></div>
                     
                {/* Цифра таймера в стиле Cobalt с явным заполнением и градиентами */}
                <div className="text-4xl font-pixel relative z-10 px-4 flex flex-col items-center">
                  <div className="cobalt-timer-container">
                    <div className="cobalt-timer-bg"></div>
                    <div 
                      className="cobalt-timer-fill" 
                      style={{
                        width: `${(countdown / 10) * 100}%`
                      }}
                    ></div>
                    <span className="cobalt-timer-text text-accent font-bold">{countdown}</span>
                    <span className="text-sm text-white ml-1">s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Индикаторы активности */}
          <div className="flex items-center gap-3 bg-ui-dark/80 backdrop-blur-sm px-5 py-2 rounded-full mt-3 border border-accent/20">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-accent rounded-full animate-pulse" 
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGraph;
