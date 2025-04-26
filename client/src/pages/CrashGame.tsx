import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useSound } from "@/contexts/SoundContext";
import { useToast } from "@/hooks/use-toast";
import CrashGraph from "@/components/CrashGraph";
import BetControls from "@/components/BetControls";
import GameHistory from "@/components/GameHistory";
import { PixelCard } from "@/components/ui/pixel-card";
import { Skeleton } from "@/components/ui/skeleton";
import cashSound from "@/assets/sounds/cash";
import { cn, formatMultiplier } from "@/lib/utils";

const CrashGame = () => {
  const { user, updateUserBalance } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { playSound } = useSound();
  
  // Game state
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [isLive, setIsLive] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [recentResults, setRecentResults] = useState<number[]>([]);
  
  // Bet state
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashoutAt, setAutoCashoutAt] = useState(2.0);
  const [currentBet, setCurrentBet] = useState<any>(null);
  const [isBetting, setIsBetting] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  
  // Polling for real-time updates (replacing WebSocket)
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;
    
    const fetchGameState = async () => {
      try {
        const response = await fetch('/api/game-state');
        if (!response.ok) throw new Error('Failed to fetch game state');
        
        const gameState = await response.json();
        
        // Update multiplier and game state
        setCurrentMultiplier(gameState.currentMultiplier);
        
        // Check if game is live
        if (gameState.currentCrashGame && !gameState.currentCrashGame.hasEnded) {
          setIsLive(true);
          setHasCrashed(false);
          
          // Auto cashout if threshold is reached and we have a bet
          if (currentBet && autoCashoutAt && gameState.currentMultiplier >= autoCashoutAt) {
            handleCashout();
          }
        } else if (gameState.gameHistory && gameState.gameHistory.length > 0) {
          // Handle crash event (game ended)
          const latestCrash = gameState.gameHistory[gameState.gameHistory.length - 1];
          
          // Only process crash if we haven't seen it yet
          if (!recentResults.includes(latestCrash.crashPoint)) {
            setCurrentMultiplier(latestCrash.crashPoint);
            setHasCrashed(true);
            setIsLive(false);
            
            // Add result to recent results
            setRecentResults(prev => {
              const updated = [latestCrash.crashPoint, ...prev];
              return updated.slice(0, 8); // Keep only 8 most recent
            });
            
            // If we had a bet and didn't cash out, mark it as lost
            if (currentBet && !currentBet.cashedOut) {
              setCurrentBet(null);
              try {
                toast({
                  title: "Crashed!",
                  description: `The game crashed at ${formatMultiplier(latestCrash.crashPoint)}. You lost your bet.`,
                  variant: "destructive"
                });
              } catch (error) {
                console.error("Error showing toast:", error);
              }
            }
          }
        }
        
        // Handle new game starting
        if (gameState.currentCrashGame && gameState.currentMultiplier === 1.0 && !isLive && !hasCrashed) {
          setCurrentGame(gameState.currentCrashGame);
          setCurrentMultiplier(1.0);
          setIsLive(false);
          setHasCrashed(false);
          
          // Reset bet state
          setCurrentBet(null);
          setIsBetting(false);
          setIsCashingOut(false);
        }
      } catch (error) {
        console.error('Error polling game state:', error);
      }
    };
    
    // Initial fetch
    fetchGameState();
    
    // Set up polling interval - check for updates every 200ms
    pollInterval = setInterval(fetchGameState, 200);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [currentBet, autoCashoutAt, isLive, hasCrashed, recentResults, toast]);
  
  // Use for loading state only
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  
  // Handle initial data loading
  useEffect(() => {
    const fetchInitialGame = async () => {
      try {
        const res = await fetch('/api/crash/current');
        if (!res.ok) return;
        
        const data = await res.json();
        setCurrentGame(data);
        
        // If game is in progress, set state accordingly
        if (data && !data.hasEnded) {
          setIsLive(true);
          setHasCrashed(false);
        }
        
        // Set loading to false
        setIsLoadingGame(false);
      } catch (error) {
        console.error('Error fetching initial game:', error);
      }
    };
    
    fetchInitialGame();
  }, []);
  
  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: async () => {
      if (!user || !currentGame) return null;
      
      const res = await apiRequest("POST", "/api/crash/bet", {
        userId: user.id,
        gameId: currentGame.id,
        betAmount,
        autoCashoutAt: autoCashoutAt || undefined
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentBet(data);
        setIsBetting(false);
        
        // Update user balance
        if (user) {
          updateUserBalance(user.balance - betAmount);
        }
        
        toast({
          title: "Bet Placed!",
          description: `Bet ${betAmount} Telegram Stars on crash game.`
        });
      }
    },
    onError: (error) => {
      console.error('Error placing bet:', error);
      setIsBetting(false);
      toast({
        title: "Bet Failed",
        description: "Failed to place bet. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Cashout mutation
  const cashoutMutation = useMutation({
    mutationFn: async () => {
      if (!currentBet) return null;
      
      const res = await apiRequest("POST", "/api/crash/cashout", {
        betId: currentBet.id,
        multiplier: currentMultiplier
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentBet({ ...currentBet, cashedOut: true });
        setIsCashingOut(false);
        
        // Play cash sound
        playSound(cashSound);
        
        // Рассчитываем правильный выигрыш на основе ставки
        const winAmount = Math.floor(currentBet.betAmount * currentMultiplier);
        const profit = winAmount - currentBet.betAmount;
        
        // Update user balance - добавляем всю сумму выигрыша к балансу
        if (user) {
          updateUserBalance(user.balance + winAmount);
        }
        
        // Show success toast с правильной информацией о выигрыше
        toast({
          title: "Успешный выигрыш!",
          description: `Вы выиграли ${profit} Telegram Stars при коэффициенте ${formatMultiplier(currentMultiplier)}!`
        });
        
        // Refresh history чтобы обновить историю игр
        queryClient.invalidateQueries({ queryKey: ['/api/history/' + user?.id] });
      }
    },
    onError: (error) => {
      console.error('Error cashing out:', error);
      setIsCashingOut(false);
      toast({
        title: "Ошибка вывода",
        description: "Не удалось вывести деньги. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
  });
  
  const handlePlaceBet = () => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to place a bet.",
        variant: "destructive"
      });
      return;
    }
    
    if (user.balance < betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough Telegram Stars.",
        variant: "destructive"
      });
      return;
    }
    
    if (isLive) {
      toast({
        title: "Game In Progress",
        description: "Wait for the next round to place a bet.",
        variant: "destructive"
      });
      return;
    }
    
    setIsBetting(true);
    placeBetMutation.mutate();
  };
  
  const handleCashout = () => {
    if (!currentBet || !isLive || hasCrashed) return;
    
    // Подтверждаем текущий коэффициент для расчета выигрыша
    const winAmount = Math.floor(currentBet.betAmount * currentMultiplier);
    const profit = winAmount - currentBet.betAmount;
    
    setIsCashingOut(true);
    cashoutMutation.mutate();
    
    // Показываем всплывающее уведомление с выигрышем
    toast({
      title: "Выигрыш!",
      description: `Вы выиграли ${profit} Telegram Stars при коэффициенте ${currentMultiplier.toFixed(2)}x!`,
      variant: "success"
    });
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Crash Game Header with Graphic Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <PixelCard className="p-4 h-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-2 h-8 bg-accent mr-2"></div>
                <h2 className="font-pixel text-white text-xl uppercase">Crash Game</h2>
              </div>
              
              <div className="flex items-center bg-ui-dark px-3 py-1.5 rounded-md">
                <span className={cn(
                  "font-pixel text-xl font-bold",
                  isLive && !hasCrashed && "text-accent animate-pulse-slow",
                  hasCrashed && "text-primary"
                )}>
                  {currentMultiplier.toFixed(2)}x
                </span>
                {isLive && !hasCrashed && (
                  <span className="bg-primary ml-2 px-2 py-0.5 rounded font-pixel text-xs flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
            </div>
            
            {/* Game Interface */}
            {isLoadingGame ? (
              <Skeleton className="h-[300px] w-full bg-ui-medium" />
            ) : (
              <CrashGraph 
                multiplier={currentMultiplier} 
                isLive={isLive}
                hasCrashed={hasCrashed}
              />
            )}
          </PixelCard>
        </div>
        
        {/* Bet Controls Column */}
        <div>
          <PixelCard className="p-4 h-full">
            <h3 className="font-pixel text-white border-b border-ui-medium pb-2 mb-4 flex items-center">
              <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
              PLACE YOUR BET
            </h3>
            
            {/* Game Controls */}
            <BetControls
              betAmount={betAmount}
              onBetChange={setBetAmount}
              secondaryValue={autoCashoutAt}
              onSecondaryChange={setAutoCashoutAt}
              secondaryLabel="AUTO CASHOUT AT"
              secondarySuffix="X"
              submitLabel={currentBet && isLive ? `CASHOUT ${Math.floor(currentBet.betAmount * currentMultiplier)} (+${Math.floor(currentBet.betAmount * currentMultiplier - currentBet.betAmount)})` : "PLACE BET"}
              onSubmit={currentBet && isLive ? handleCashout : handlePlaceBet}
              isSubmitDisabled={
                (currentBet && (!isLive || hasCrashed)) || 
                (!currentBet && isLive) ||
                !user
              }
              isLoading={isBetting || isCashingOut}
              variant={currentBet && isLive ? "secondary" : "primary"}
            />
          </PixelCard>
        </div>
      </div>
      
      {/* Recent Results and Game History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <PixelCard className="p-4">
            <h3 className="font-pixel text-white border-b border-ui-medium pb-2 mb-4 flex items-center">
              <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
              RECENT RESULTS
            </h3>
            <div className="grid grid-cols-3 gap-2 scrollbar-cobalt overflow-auto pb-1 max-h-40">
              {recentResults.map((result, index) => (
                <div 
                  key={index}
                  className={cn(
                    "px-3 py-2 rounded-md font-pixel text-center whitespace-nowrap transition-all",
                    result < 2 
                      ? "result-lose" 
                      : "result-win",
                    index === 0 && "border-gold animate-pulse-soft" // Highlight the most recent result
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    result < 2 ? "text-danger-foreground" : "text-success-foreground"
                  )}>
                    {result.toFixed(2)}x
                  </span>
                </div>
              ))}
              {recentResults.length === 0 && (
                <div className="col-span-3 text-muted-foreground font-pixelText text-center py-4">
                  No recent results. Start playing to see game history!
                </div>
              )}
            </div>
          </PixelCard>
        </div>
        
        <div className="lg:col-span-2">
          {/* Player's Game History */}
          <PixelCard className="p-4">
            <h3 className="font-pixel text-white border-b border-ui-medium pb-2 mb-4 flex items-center">
              <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
              YOUR GAME HISTORY
            </h3>
            <GameHistory limit={5} showPagination={true} />
          </PixelCard>
        </div>
      </div>
    </div>
  );
};

export default CrashGame;
