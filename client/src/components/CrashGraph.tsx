import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getCrashGraphHeight } from "@/lib/game-logic";
import { useSound } from "@/contexts/SoundContext";
import crashSound from "@/assets/sounds/crash";

interface CrashGraphProps {
  multiplier: number;
  isLive: boolean;
  hasCrashed: boolean;
  waitingForBets?: boolean;
  waitingCountdown?: number;
}

// Оптимизированный компонент CrashGraph
const CrashGraph = ({ multiplier, isLive, hasCrashed, waitingForBets, waitingCountdown }: CrashGraphProps) => {
  const [height, setHeight] = useState(0);
  const [starPosition, setStarPosition] = useState(100); // Position from the bottom (%)
  const [displayMultiplier, setDisplayMultiplier] = useState(1.00); // Отдельное состояние для отображения
  const animationFrameRef = useRef<number>();
  const { playSound } = useSound();
  
  // Обновление отображаемого коэффициента
  useEffect(() => {
    if (isLive && !hasCrashed) {
      setDisplayMultiplier(multiplier);
    } else if (hasCrashed) {
      // При крашах сразу сбрасываем к 0
      setDisplayMultiplier(0.00);
    } else if (!isLive && !hasCrashed) {
      // Сбрасываем до 0.00 когда игра завершилась и начинается новая
      setDisplayMultiplier(0.00);
    }
  }, [multiplier, isLive, hasCrashed]);
  
  // Стейты для анимации взрыва
  const [showExplosion, setShowExplosion] = useState(false);
  const [redGlow, setRedGlow] = useState(false);

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

      // Сбрасываем эффекты взрыва при новой игре
      setRedGlow(false);
      setShowExplosion(false);
    } else if (hasCrashed) {
      // Звук краша
      try {
        playSound(crashSound);
      } catch (error) {
        console.log("Не удалось воспроизвести звук краша", error);
      }
      
      // Активируем эффекты взрыва с небольшой задержкой, чтобы синхронизировать с другими эффектами
      setTimeout(() => {
        setShowExplosion(true);
        setRedGlow(true);
      }, 50);
    }
    
    // Очистка
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [multiplier, isLive, hasCrashed]);
  
  // Сброс позиций при окончании игры
  useEffect(() => {
    if (!isLive) {
      setHeight(0);
      setStarPosition(100);
    }
  }, [isLive]);
  
  // Убираем белые точки на фоне по просьбе пользователя
  const stars: React.ReactNode[] = [];
  
  return (
    <div className={cn(
      "crash-graph mb-4 bg-ui-medium rounded-md relative overflow-hidden border border-ui-dark",
      redGlow && "red-glow-animation" 
    )}>
      {/* Звездное небо */}
      <div className="absolute inset-0 bg-ui-dark/80 z-0">
        {stars}
      </div>
      
      {/* Красное свечение по всему экрану при крашах - улучшенная версия */}
      {redGlow && (
        <>
          {/* Основной красный оверлей */}
          <div className="absolute inset-0 bg-red-600/50 z-20 animate-red-pulse pointer-events-none"></div>
          
          {/* Дополнительные слои градиента для усиления эффекта */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-700/30 to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-red-700/30 to-transparent z-20 pointer-events-none"></div>
          
          {/* Пульсирующий вихрь в центре */}
          <div className="absolute left-1/2 top-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 bg-red-500/20 rounded-full animate-pulse-fast blur-xl z-20 pointer-events-none"></div>
        </>
      )}

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

      {/* Анимация взрыва звезды - улучшенная версия */}
      {showExplosion && (
        <div className="absolute left-1/2 z-30"
          style={{ 
            bottom: `${Math.min(50, starPosition)}%`,
            transform: "translate(-50%, 50%)"
          }}
        >
          <div className="absolute inset-0 w-60 h-60 -translate-x-1/2 -translate-y-1/2">
            {/* Длинные лучи взрыва */}
            <div className="absolute w-full h-full animate-star-explosion">
              {Array.from({ length: 16 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-24 bg-gradient-to-r from-red-600 via-yellow-500 to-orange-500 rounded"
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center bottom',
                    transform: `rotate(${i * 22.5}deg) translateY(-100%)`,
                    opacity: 0.8,
                    filter: 'blur(1px)'
                  }}
                />
              ))}
            </div>
            
            {/* Короткие резкие лучи */}
            <div className="absolute w-full h-full animate-star-explosion" style={{ animationDelay: '0.1s' }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-3 h-14 bg-gradient-to-r from-yellow-300 via-orange-500 to-red-500 rounded"
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center bottom',
                    transform: `rotate(${i * 30 + 15}deg) translateY(-90%)`,
                    opacity: 0.9,
                    filter: 'blur(0px)'
                  }}
                />
              ))}
            </div>
            
            {/* Круговое свечение - большие круги */}
            <div className="absolute w-48 h-48 bg-red-600/70 -translate-x-1/2 -translate-y-1/2 rounded-full animate-expand-fade"></div>
            <div className="absolute w-36 h-36 bg-yellow-500/80 -translate-x-1/2 -translate-y-1/2 rounded-full animate-expand-fade delay-100"></div>
            <div className="absolute w-24 h-24 bg-white/90 -translate-x-1/2 -translate-y-1/2 rounded-full animate-expand-fade delay-200"></div>
            
            {/* Дополнительное красное свечение для усиления эффекта */}
            <div className="absolute w-full h-full -translate-x-1/2 -translate-y-1/2">
              <div className="absolute w-60 h-60 bg-red-600/30 rounded-full animate-red-pulse"></div>
              <div className="absolute w-72 h-72 bg-red-500/20 rounded-full animate-red-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            {/* Искры разлетающиеся во все стороны */}
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = Math.random() * 360;
              const distance = 30 + Math.random() * 80;
              const delay = Math.random() * 0.3;
              const size = 2 + Math.random() * 5;
              
              return (
                <div 
                  key={`spark-${i}`} 
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: `${size}px`,
                    height: `${size}px`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${distance}px)`,
                    opacity: 0.9,
                    animation: `expand-fade 0.6s forwards`,
                    animationDelay: `${delay}s`,
                    boxShadow: '0 0 8px 2px rgba(255, 215, 0, 0.6)'
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Звезда и коэффициент */}
      {isLive && !hasCrashed && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 transition-all"
          style={{ 
            bottom: `${Math.min(50, starPosition)}%`,
            filter: `drop-shadow(0 0 ${Math.min(15, 5 + displayMultiplier/3)}px rgba(255, 215, 0, 0.6))`,
            zIndex: 10,
            transition: 'bottom 0.15s ease-out'
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Звезда */}
            <div 
              className={`relative ${displayMultiplier >= 2 ? 'animate-subtle-wobble' : ''}`}
              style={{
                transform: `scale(${Math.min(1.5, 1 + displayMultiplier/15)})`,
              }}
            >
              {/* Свечение */}
              <div className="absolute -inset-1 bg-yellow-400 rounded-full opacity-30 animate-pulse-slow blur-md"></div>
              
              {/* Обычная звезда */}
              <div className="w-16 h-16 text-yellow-400">
                <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              
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
                fontSize: Math.min(28, 18 + (displayMultiplier / 2)) + 'px',
                fontWeight: displayMultiplier >= 2 ? 'bold' : 'normal',
                transition: 'all 0.1s ease-out'
              }}
            >
              {displayMultiplier.toFixed(2)}x
            </div>
          </div>
        </div>
      )}
      
      {/* Эффект краша - упрощенный для лучшей производительности - всегда показывается */}
      {hasCrashed && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start z-40 pt-20">
          <div className="relative">
            {/* Свечение */}
            <div className="absolute inset-0 bg-red-600 rounded-full animate-pulse-fast opacity-70 blur-xl" 
                style={{ transform: 'scale(3)' }}></div>
            
            {/* Текст */}
            <div className="bg-red-600 px-8 py-5 rounded-lg font-pixel text-white z-50 relative animate-shake border-2 border-yellow-500">
              <span className="text-2xl font-bold block text-center mb-1">CRASHED!</span>
              <span className="block text-3xl font-bold text-yellow-300 text-center">0.00x</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Таймер обратного отсчета + коэффициент 0.00 когда игра не активна */}
      {waitingCountdown !== undefined && !isLive && (
        <div className="absolute top-[35%] left-0 w-full flex flex-col items-center justify-center z-30">
          {/* Показываем нулевой коэффициент */}
          <div className="font-pixel text-4xl font-bold text-yellow-400 mb-4">
            0.00x
          </div>
          
          {/* Показываем таймер обратного отсчета */}
          <div className="font-pixel text-6xl font-bold text-yellow-400 animate-pulse-slow">
            {waitingCountdown}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashGraph;
