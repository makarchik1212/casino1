import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSound } from "@/contexts/SoundContext";
import cashSound from "@/assets/sounds/cash";
import clickSound from "@/assets/sounds/click";
import crashSound from "@/assets/sounds/crash";
import StarIcon from "@/assets/icons/StarIcon";
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

type CellState = 'hidden' | 'safe' | 'mine';
type GridCell = { position: number, state: CellState };

const MineGrid = ({
  mineCount,
  revealedPositions,
  minePositions,
  onReveal,
  isGameOver,
  isWin,
  isLoading
}: MineGridProps) => {
  const [grid, setGrid] = useState<GridCell[]>(
    Array.from({ length: 25 }, (_, i) => ({ position: i, state: 'hidden' as CellState }))
  );
  const { playSound } = useSound();
  
  // Update grid based on revealed positions and mine positions
  useEffect(() => {
    // Create a new grid based on the current state
    let updatedGrid = [...grid];
    
    if (isGameOver && minePositions) {
      // Show all mines when game is over
      updatedGrid = updatedGrid.map(cell => {
        if (minePositions.includes(cell.position)) {
          return { ...cell, state: 'mine' as CellState };
        } else if (revealedPositions.includes(cell.position)) {
          return { ...cell, state: 'safe' as CellState };
        }
        return { ...cell, state: 'hidden' as CellState };
      });
      
      // Play sound based on win/lose state
      if (isWin) {
        playSound(cashSound);
      } else {
        playSound(crashSound);
      }
    } else {
      // Only show revealed positions during gameplay
      updatedGrid = updatedGrid.map(cell => {
        if (revealedPositions.includes(cell.position)) {
          return { ...cell, state: 'safe' as CellState };
        }
        return { ...cell, state: 'hidden' as CellState };
      });
    }
    
    setGrid(updatedGrid);
  }, [revealedPositions, minePositions, isGameOver, isWin, playSound]);
  
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
          {cell.state === 'safe' && <StarIcon size={20} />}
          {cell.state === 'mine' && <X size={20} strokeWidth={3} />}
        </div>
      ))}
    </div>
  );
};

export default MineGrid;
