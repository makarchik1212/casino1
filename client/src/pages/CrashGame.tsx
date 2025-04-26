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
  const wsRef = useRef<WebSocket | null>(null);
  
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
  
  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'crash_update') {
        setCurrentMultiplier(data.currentMultiplier);
        setIsLive(true);
        setHasCrashed(false);
        
        // Auto cashout if threshold is reached and we have a bet
        if (currentBet && autoCashoutAt && data.currentMultiplier >= autoCashoutAt) {
          handleCashout();
        }
      }
      else if (data.type === 'crash_ended') {
        setCurrentMultiplier(data.crashPoint);
        setHasCrashed(true);
        setIsLive(false);
        
        // Add result to recent results
        setRecentResults(prev => {
          const updated = [data.crashPoint, ...prev];
          return updated.slice(0, 8); // Keep only 8 most recent
        });
        
        // If we had a bet and didn't cash out, mark it as lost
        if (currentBet && !currentBet.cashedOut) {
          setCurrentBet(null);
          toast({
            title: "Crashed!",
            description: `The game crashed at ${formatMultiplier(data.crashPoint)}. You lost your bet.`,
            variant: "destructive"
          });
        }
      }
      else if (data.type === 'crash_new_game') {
        // Prepare for new game
        setCurrentGame({ id: data.gameId });
        setCurrentMultiplier(1.0);
        setIsLive(false);
        setHasCrashed(false);
        
        // Reset bet state
        setCurrentBet(null);
        setIsBetting(false);
        setIsCashingOut(false);
      }
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentBet, autoCashoutAt]);
  
  // Get current game on mount
  const { isLoading: isLoadingGame } = useQuery({
    queryKey: ['/api/crash/current'],
    onSuccess: (data) => {
      setCurrentGame(data);
      // If game is in progress, set state accordingly
      if (!data.hasEnded) {
        setIsLive(true);
        setHasCrashed(false);
      }
    }
  });
  
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
        
        // Update user balance
        if (user) {
          const profit = Math.floor(betAmount * currentMultiplier) - betAmount;
          updateUserBalance(user.balance + betAmount + profit);
        }
        
        // Show success toast
        toast({
          title: "Cashed Out!",
          description: `You won ${Math.floor(betAmount * currentMultiplier) - betAmount} Telegram Stars at ${formatMultiplier(currentMultiplier)}!`
        });
        
        // Refresh history
        queryClient.invalidateQueries({ queryKey: ['/api/history/' + user?.id] });
      }
    },
    onError: (error) => {
      console.error('Error cashing out:', error);
      setIsCashingOut(false);
      toast({
        title: "Cashout Failed",
        description: "Failed to cash out. Please try again.",
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
    
    setIsCashingOut(true);
    cashoutMutation.mutate();
  };
  
  return (
    <div>
      <PixelCard className="mb-8 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-pixel text-white text-lg">CRASH GAME</h2>
          <div className="flex items-center">
            <span className={cn(
              "font-pixel text-xl mr-2",
              isLive && !hasCrashed && "text-accent blink",
              hasCrashed && "text-primary"
            )}>
              {currentMultiplier.toFixed(2)}x
            </span>
            {isLive && !hasCrashed && (
              <span className="bg-primary px-2 py-1 rounded font-pixel text-xs">LIVE</span>
            )}
          </div>
        </div>
        
        {/* Game Interface */}
        {isLoadingGame ? (
          <Skeleton className="h-[200px] w-full bg-ui-medium" />
        ) : (
          <CrashGraph 
            multiplier={currentMultiplier} 
            isLive={isLive}
            hasCrashed={hasCrashed}
          />
        )}
        
        {/* Game Controls */}
        <BetControls
          betAmount={betAmount}
          onBetChange={setBetAmount}
          secondaryValue={autoCashoutAt}
          onSecondaryChange={setAutoCashoutAt}
          secondaryLabel="AUTO CASHOUT AT"
          secondarySuffix="X"
          submitLabel={currentBet && isLive ? `CASHOUT ${Math.floor(betAmount * currentMultiplier)}` : "PLACE BET"}
          onSubmit={currentBet && isLive ? handleCashout : handlePlaceBet}
          isSubmitDisabled={
            (currentBet && (!isLive || hasCrashed)) || 
            (!currentBet && isLive) ||
            !user
          }
          isLoading={isBetting || isCashingOut}
          variant={currentBet && isLive ? "secondary" : "primary"}
        />
        
        {/* Game History */}
        <div className="mt-6">
          <h3 className="font-pixel text-sm mb-2">RECENT RESULTS</h3>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {recentResults.map((result, index) => (
              <div 
                key={index}
                className={cn(
                  "px-3 py-1 rounded font-pixel text-xs whitespace-nowrap",
                  result < 2 ? "bg-danger" : "bg-success"
                )}
              >
                {result.toFixed(2)}x
              </div>
            ))}
            {recentResults.length === 0 && (
              <div className="text-muted-foreground font-pixelText">
                No recent results. Start playing to see game history!
              </div>
            )}
          </div>
        </div>
      </PixelCard>
      
      {/* Player's Game History */}
      <GameHistory limit={5} />
    </div>
  );
};

export default CrashGame;
