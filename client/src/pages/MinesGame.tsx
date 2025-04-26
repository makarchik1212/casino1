import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useSound } from "@/contexts/SoundContext";
import { useToast } from "@/hooks/use-toast";
import MineGrid from "@/components/MineGrid";
import BetControls from "@/components/BetControls";
import GameHistory from "@/components/GameHistory";
import { PixelCard } from "@/components/ui/pixel-card";
import { calculateMinesPotentialProfit } from "@/lib/game-logic";
import cashSound from "@/assets/sounds/cash";

const MinesGame = () => {
  const { user, updateUserBalance } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { playSound } = useSound();
  
  // Game state
  const [gameId, setGameId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(5);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[] | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  
  // Loading states
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isRevealingCell, setIsRevealingCell] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  
  // Check for active game on mount
  const { data: activeGame, isLoading: isCheckingGame } = useQuery({
    queryKey: ['/api/mines/active', user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/mines/active/${user?.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch active game');
        }
        return res.json();
      } catch (error) {
        console.error('Error fetching active game:', error);
        return null;
      }
    }
  });
  
  // Initialize game if active game exists
  useEffect(() => {
    if (activeGame) {
      setGameId(activeGame.id);
      setBetAmount(activeGame.betAmount);
      setMineCount(activeGame.mineCount);
      setCurrentMultiplier(activeGame.currentMultiplier);
      setRevealedPositions(activeGame.revealedPositions);
    }
  }, [activeGame]);
  
  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      
      const res = await apiRequest("POST", "/api/mines/start", {
        userId: user.id,
        betAmount,
        mineCount
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setGameId(data.id);
        setRevealedPositions([]);
        setMinePositions(null);
        setCurrentMultiplier(1.0);
        setIsGameOver(false);
        setIsWin(false);
        setIsStartingGame(false);
        
        // Update user balance
        if (user) {
          updateUserBalance(user.balance - betAmount);
        }
        
        toast({
          title: "Game Started!",
          description: `Bet ${betAmount} Telegram Stars with ${mineCount} mines.`
        });
      }
    },
    onError: (error) => {
      console.error('Error starting game:', error);
      setIsStartingGame(false);
      toast({
        title: "Start Game Failed",
        description: "Failed to start game. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Reveal cell mutation
  const revealCellMutation = useMutation({
    mutationFn: async (position: number) => {
      if (!gameId) return null;
      
      const res = await apiRequest("POST", "/api/mines/reveal", {
        gameId,
        position
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setRevealedPositions(data.revealedPositions);
        setCurrentMultiplier(data.currentMultiplier);
        setIsRevealingCell(false);
        
        // Check if mine was hit
        if (data.isCompleted && !data.isCashedOut) {
          setIsGameOver(true);
          setIsWin(false);
          setMinePositions(data.minePositions);
          
          toast({
            title: "Game Over!",
            description: "You hit a mine and lost your bet.",
            variant: "destructive"
          });
        }
      }
    },
    onError: (error) => {
      console.error('Error revealing cell:', error);
      setIsRevealingCell(false);
      toast({
        title: "Reveal Failed",
        description: "Failed to reveal cell. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Cashout mutation
  const cashoutMutation = useMutation({
    mutationFn: async () => {
      if (!gameId) return null;
      
      const res = await apiRequest("POST", "/api/mines/cashout", {
        gameId
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setIsGameOver(true);
        setIsWin(true);
        setMinePositions(data.minePositions);
        setIsCashingOut(false);
        
        // Play cash sound
        playSound(cashSound);
        
        // Update user balance
        if (user) {
          const profit = data.profit;
          updateUserBalance(user.balance + betAmount + profit);
        }
        
        // Show success toast
        toast({
          title: "Cashed Out!",
          description: `You won ${data.profit} Telegram Stars!`
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
  
  const handleStartGame = () => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to play.",
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
    
    setIsStartingGame(true);
    startGameMutation.mutate();
  };
  
  const handleRevealCell = (position: number) => {
    if (!gameId || isRevealingCell || isGameOver) return;
    
    setIsRevealingCell(true);
    revealCellMutation.mutate(position);
  };
  
  const handleCashout = () => {
    if (!gameId || isGameOver || isCashingOut) return;
    
    setIsCashingOut(true);
    cashoutMutation.mutate();
  };
  
  const potentialProfit = calculateMinesPotentialProfit(betAmount, currentMultiplier);
  
  return (
    <div>
      <PixelCard className="mb-8 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-pixel text-white text-lg">MINES GAME</h2>
          <div>
            <span className="text-accent font-pixel text-md">
              MULTIPLIER: <span className="text-white">{currentMultiplier.toFixed(2)}x</span>
            </span>
          </div>
        </div>
        
        {/* Game Interface */}
        <MineGrid
          mineCount={mineCount}
          revealedPositions={revealedPositions}
          minePositions={minePositions}
          onReveal={handleRevealCell}
          isGameOver={isGameOver}
          isWin={isWin}
          isLoading={isRevealingCell}
        />
        
        {/* Game Controls */}
        {!gameId || isGameOver ? (
          <BetControls
            betAmount={betAmount}
            onBetChange={setBetAmount}
            secondaryValue={mineCount}
            onSecondaryChange={setMineCount}
            secondaryLabel="MINES COUNT"
            secondarySuffix=""
            submitLabel="START GAME"
            onSubmit={handleStartGame}
            isSubmitDisabled={!user || isStartingGame}
            isLoading={isStartingGame || isCheckingGame}
            variant="secondary"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-ui-medium p-3 rounded">
              <label className="font-pixel text-xs block mb-2">BET AMOUNT</label>
              <div className="bg-dark text-white text-center font-pixel p-2">
                {betAmount} STARS
              </div>
            </div>
            
            <div className="bg-ui-medium p-3 rounded">
              <label className="font-pixel text-xs block mb-2">POTENTIAL PROFIT</label>
              <div className="bg-dark text-white text-center font-pixel p-2">
                {potentialProfit} STARS
              </div>
            </div>
            
            <div className="bg-ui-medium p-3 rounded flex items-center justify-center">
              <button 
                className="pixel-btn bg-secondary hover:bg-green-600 font-pixel text-white w-full py-3 rounded text-lg"
                onClick={handleCashout}
                disabled={isCashingOut}
              >
                {isCashingOut ? "CASHING OUT..." : `CASHOUT ${betAmount + potentialProfit}`}
              </button>
            </div>
          </div>
        )}
      </PixelCard>
      
      {/* Player's Game History */}
      <GameHistory limit={5} />
    </div>
  );
};

export default MinesGame;
