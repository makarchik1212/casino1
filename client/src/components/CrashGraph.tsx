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
        
        // Обновляем позицию звезды - в стиле Cobalt Lab
        setStarPosition(prev => {
          // На Cobalt Lab ракета начинает с нижней части экрана и поднимается вверх, замедляясь
          // при более высоких коэффициентах
          const startPos = 100; // Начало снизу экрана (100%)
          const minPos = 15;    // Максимальная высота подъема (15% от низа)
          
          // Логарифмическая функция для замедления подъема (точно как на Cobalt Lab)
          // Используется натуральный логарифм для замедления при высоких коэффициентах
          const logBase = 1.18; // Настройка скорости замедления
          const logProgress = Math.log(multiplier) / Math.log(logBase);
          
          // Ограничиваем прогресс диапазоном 0-1
          const progressFactor = Math.min(1, logProgress * 0.12); 
          
          // Кубическое замедление для более естественного движения (как на Cobalt Lab)
          const easing = 1 - Math.pow(1 - progressFactor, 3);
          
          // Рассчитываем новую позицию с учетом замедления
          const newPosition = startPos - (startPos - minPos) * easing;
          
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
  
  // Управление обратным отсчетом от переданного значения с сервера
  useEffect(() => {
    // Сбрасываем высоту графика и позицию звезды когда не в игре
    if (!isLive) {
      setHeight(0);
      setStarPosition(100); // Reset star to bottom
    }
    
    // Если нам передали waitingCountdown с сервера, используем его
    if (waitingCountdown !== undefined) {
      setCountdown(waitingCountdown);
    }
    // Если режим ожидания закончился, сбрасываем счетчик
    else if (!waitingForBets && isLive) {
      setCountdown(0);
    }
  }, [isLive, waitingForBets, waitingCountdown]);
  
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
      
      {/* Rocket/Star Animation (точно как на Cobalt Lab) */}
      {isLive && !hasCrashed && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all"
          style={{ 
            bottom: `${Math.min(50, starPosition)}%`, // Max at 50% height (center of screen)
            filter: `drop-shadow(0 0 ${Math.min(20, 5 + multiplier/2)}px rgba(255, 215, 0, 0.7))`,
            zIndex: 10, // Ensure star is above graph line
            transition: 'bottom 0.15s ease-out' // Более плавное движение вверх как на Cobalt Lab
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Главная звезда (в стиле ракеты Cobalt Lab) */}
            <div 
              className={`relative ${multiplier >= 2 ? 'animate-subtle-wobble' : ''}`}
              style={{
                transform: `scale(${Math.min(1.5, 1 + multiplier/15)})`, // Рост с увеличением множителя
              }}
            >
              {/* Эффект свечения как на Cobalt Lab */}
              <div className="absolute -inset-1 bg-yellow-400 rounded-full opacity-30 animate-pulse-slow blur-md"></div>
              
              {/* Основная звезда - более яркая */}
              <StarIcon size={50} className="text-yellow-400" />
              
              {/* Эффекты "двигателя" - точно как на Cobalt Lab */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-80">
                <div className="w-1 h-8 bg-gradient-to-t from-yellow-500 via-orange-500 to-transparent rounded-full animate-flicker"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 blur-sm rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Коэффициент в стиле Cobalt Lab - ниже звезды без фона */}
            <div 
              className="mt-3 font-pixel whitespace-nowrap"
              style={{
                color: '#FFDE30', // Ярко-желтый как на Cobalt Lab
                textShadow: '0 0 10px rgba(255, 215, 0, 0.7)',
                fontSize: Math.min(28, 18 + (multiplier / 2)) + 'px', // Динамический размер
                fontWeight: multiplier >= 2 ? 'bold' : 'normal',
                transition: 'all 0.1s ease-out'
              }}
            >
              {multiplier.toFixed(2)}x
            </div>
          </div>
        </div>
      )}
      
      {/* Большой коэффициент отображается вместе со звездой, поэтому здесь он не нужен */}
      
      {/* Эффект взрыва в стиле Cobalt Lab с сохранением звезды */}
      {hasCrashed && waitingCountdown === undefined && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-40">
          {/* Основной эффект взрыва */}
          <div className="relative">
            {/* Фоновое свечение взрыва как на Cobalt Lab */}
            <div className="absolute inset-0 bg-yellow-500 rounded-full animate-pulse opacity-60 blur-xl" 
                style={{ transform: 'scale(3)' }}></div>
                
            {/* Частицы взрыва в стиле Cobalt Lab - летят во все стороны */}
            {Array.from({length: 20}).map((_, i) => {
              // Случайный угол для равномерного распределения частиц
              const angle = (i / 20) * 360 + (Math.random() * 18); // Распределяем равномерно + небольшая случайность
              const distance = 50 + Math.random() * 100; // Дальность полета
              const size = 2 + Math.random() * 4; // Размер частицы
              const delay = Math.random() * 0.15; // Задержка анимации
              const duration = 0.5 + Math.random() * 0.4; // Длительность анимации
              
              // Свойства для анимации частицы
              const style = {
                '--x': `${Math.cos(angle * (Math.PI/180)) * distance}px`,
                '--y': `${Math.sin(angle * (Math.PI/180)) * distance}px`,
                '--duration': `${duration}s`,
              } as React.CSSProperties;
              
              return (
                <div 
                  key={i}
                  className="absolute rounded-full animate-explosion-particle" 
                  style={{
                    left: '50%',
                    top: '50%',
                    width: `${size}px`,
                    height: `${size}px`,
                    opacity: 0.9,
                    background: i % 3 === 0 ? '#FFD700' : (i % 3 === 1 ? '#FF8C00' : '#FF4500'), // Желтые и оранжевые частицы
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    boxShadow: '0 0 4px rgba(255, 215, 0, 0.7)',
                    ...style
                  }}
                ></div>
              );
            })}
            
            {/* Текст о краше - в стиле Cobalt Lab (большой, заметный) */}
            <div className="bg-red-600 px-8 py-5 rounded-lg font-pixel text-white z-50 relative animate-shake border-2 border-yellow-500">
              <span className="text-2xl font-bold block text-center mb-1">CRASHED!</span>
              <span className="block text-3xl font-bold text-yellow-300 text-center">{multiplier.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Таймер отсчета в стиле Cobalt Lab - показывается в центре экрана */}
      {waitingForBets && waitingCountdown !== undefined && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <div className="relative z-30">
            <div className="bg-ui-dark/90 px-8 py-6 rounded-lg border-2 border-yellow-500/50 shadow-lg text-center">
              <div className="text-xl font-pixel text-white mb-2">СЛЕДУЮЩАЯ ИГРА</div>
              <div className="text-4xl font-pixel font-bold text-yellow-400 pulse-live">
                {waitingCountdown}s
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGraph;
