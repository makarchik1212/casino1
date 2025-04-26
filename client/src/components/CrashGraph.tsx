import { useState, useEffect, useRef, memo } from "react";
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

// Оптимизированный компонент CrashGraph с мемоизацией
const CrashGraph = memo(({ multiplier, isLive, hasCrashed, waitingForBets, waitingCountdown }: CrashGraphProps) => {
  const [height, setHeight] = useState(0);
  const [starPosition, setStarPosition] = useState(100); // Position from the bottom (%)
  const animationFrameRef = useRef<number>();
  const { playSound } = useSound();
  
  // Эффект для анимации звезды и линии графика (оптимизированный)
  useEffect(() => {
    if (isLive && !hasCrashed) {
      // Анимация высоты линии графика
      const targetHeight = getCrashGraphHeight(multiplier);
      
      // Управление позицией звезды и высотой графика в одной анимации
      const animate = () => {
        // Обновление высоты
        setHeight(prevHeight => {
          const newHeight = Math.min(targetHeight, prevHeight + 1);
          return newHeight;
        });
        
        // Обновление позиции звезды
        setStarPosition(prev => {
          // Логика в стиле Cobalt Lab для движения звезды
          const startPos = 100; // Стартовая позиция (снизу)
          const minPos = 15;    // Максимальная высота
          
          // Используем логарифмическую функцию для замедления движения при высоких значениях
          const logBase = 1.2;
          const logProgress = Math.log(multiplier) / Math.log(logBase);
          const progressFactor = Math.min(1, logProgress * 0.15);
          
          // Плавное замедление
          const newPosition = startPos - (startPos - minPos) * progressFactor;
          return newPosition;
        });
        
        // Продолжаем анимацию если не достигли целевой высоты
        if (height < targetHeight) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      // Запускаем анимацию
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (hasCrashed) {
      // Звук краша
      playSound(crashSound);
    }
    
    // Очистка
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [multiplier, isLive, hasCrashed, height]);
  
  // Сброс позиций при окончании игры
  useEffect(() => {
    if (!isLive) {
      setHeight(0);
      setStarPosition(100);
    }
  }, [isLive]);
  
  return (
    <div className="crash-graph mb-4 bg-ui-medium rounded-md relative overflow-hidden border border-ui-dark">
      {/* Фоновая сетка */}
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 opacity-20 pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="border border-white/10"></div>
        ))}
      </div>
      
      {/* Градиент фона */}
      <div className="absolute inset-0 bg-gradient-to-tr from-ui-dark/40 to-transparent"></div>
      
      {/* Линия графика */}
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
      
      {/* Звезда и коэффициент */}
      {isLive && !hasCrashed && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all"
          style={{ 
            bottom: `${Math.min(50, starPosition)}%`,
            filter: `drop-shadow(0 0 ${Math.min(15, 5 + multiplier/3)}px rgba(255, 215, 0, 0.6))`,
            zIndex: 10,
            transition: 'bottom 0.15s ease-out'
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Звезда */}
            <div 
              className={`relative ${multiplier >= 2 ? 'animate-subtle-wobble' : ''}`}
              style={{
                transform: `scale(${Math.min(1.5, 1 + multiplier/15)})`,
              }}
            >
              {/* Свечение */}
              <div className="absolute -inset-1 bg-yellow-400 rounded-full opacity-30 animate-pulse-slow blur-md"></div>
              
              {/* Основная звезда */}
              <StarIcon size={50} className="text-yellow-400" />
              
              {/* "Двигатель" */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-80">
                <div className="w-1 h-8 bg-gradient-to-t from-yellow-500 via-orange-500 to-transparent rounded-full animate-flicker"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 blur-sm rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Отображение коэффициента */}
            <div 
              className="mt-3 font-pixel whitespace-nowrap"
              style={{
                color: '#FFDE30',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.7)',
                fontSize: Math.min(28, 18 + (multiplier / 2)) + 'px',
                fontWeight: multiplier >= 2 ? 'bold' : 'normal',
                transition: 'all 0.1s ease-out'
              }}
            >
              {multiplier.toFixed(2)}x
            </div>
          </div>
        </div>
      )}
      
      {/* Эффект краша - упрощенный для лучшей производительности */}
      {hasCrashed && waitingCountdown === undefined && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-40">
          <div className="relative">
            {/* Свечение */}
            <div className="absolute inset-0 bg-yellow-500 rounded-full animate-pulse opacity-60 blur-xl" 
                style={{ transform: 'scale(3)' }}></div>
            
            {/* Текст */}
            <div className="bg-red-600 px-8 py-5 rounded-lg font-pixel text-white z-50 relative animate-shake border-2 border-yellow-500">
              <span className="text-2xl font-bold block text-center mb-1">CRASHED!</span>
              <span className="block text-3xl font-bold text-yellow-300 text-center">{multiplier.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Таймер обратного отсчета */}
      {waitingCountdown !== undefined && waitingCountdown > 0 && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-50">
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
});

CrashGraph.displayName = "CrashGraph";

export default CrashGraph;
