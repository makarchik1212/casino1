import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSound } from "@/contexts/SoundContext";
import cashSound from "@/assets/sounds/cash";
import clickSound from "@/assets/sounds/click";
import crashSound from "@/assets/sounds/crash";
import CoinIcon from "@/assets/icons/CoinIcon";
import { X } from "lucide-react";

interface MineGridProps {
  mineCount: number;
  revealedPositions: number[];
  minePositions: number[] | null;
  onReveal: (position: number) => void;
  isGameOver: boolean;
  isWin: boolean;
  isLoading: boolean;
}

const MineGrid = ({
  mineCount,
  revealedPositions,
  minePositions,
  onReveal,
  isGameOver,
  isWin,
  isLoading
}: MineGridProps) => {
  const [grid, setGrid] = useState<Array<{ position: number, state: 'hidden' | 'safe' | 'mine' }>>(
    Array.from({ length: 25 }, (_, i) => ({ position: i, state: 'hidden' }))
  );
  const { playSound } = useSound();
  
  // Update grid based on revealed positions and mine positions
  useEffect(() => {
    if (isGameOver && minePositions) {
      // If game is over, show all mines
      const newGrid = grid.map(cell => {
        if (minePositions.includes(cell.position)) {
          return { ...cell, state: 'mine' };
        } else if (revealedPositions.includes(cell.position)) {
          return { ...cell, state: 'safe' };
        }
        return cell;
      });
      setGrid(newGrid);
      
      // Play sound
      if (isWin) {
        playSound(cashSound);
      } else {
        playSound(crashSound);
      }
    } else {
      // Only show revealed positions
      const newGrid = grid.map(cell => {
        if (revealedPositions.includes(cell.position)) {
          return { ...cell, state: 'safe' };
        }
        return { ...cell, state: 'hidden' };
      });
      setGrid(newGrid);
    }
  }, [revealedPositions, minePositions, isGameOver, isWin]);
  
  const handleCellClick = (position: number) => {
    if (isLoading || isGameOver || revealedPositions.includes(position)) return;
    
    // Play click sound
    playSound(clickSound);
    
    // Trigger reveal callback
    onReveal(position);
  };
  
  return (
    <div className="mine-grid mb-4">
      {grid.map((cell) => (
        <div
          key={cell.position}
          className={cn(
            "mine-cell rounded cursor-pointer flex items-center justify-center",
            cell.state === 'hidden' && "bg-ui-medium hover:bg-ui-dark",
            cell.state === 'safe' && "bg-success",
            cell.state === 'mine' && "bg-danger",
            (isLoading) && "opacity-70 cursor-not-allowed"
          )}
          onClick={() => handleCellClick(cell.position)}
        >
          {cell.state === 'safe' && <CoinIcon size={20} />}
          {cell.state === 'mine' && <X size={20} strokeWidth={3} />}
        </div>
      ))}
    </div>
  );
};

export default MineGrid;
