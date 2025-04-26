import { useState, useEffect } from "react";
import { useSound } from "@/contexts/SoundContext";
import { PixelButton } from "@/components/ui/pixel-button";
import clickSound from "@/assets/sounds/click";

interface BetControlsProps {
  betAmount: number;
  onBetChange: (amount: number) => void;
  secondaryValue?: number;
  onSecondaryChange?: (value: number) => void;
  secondaryLabel?: string;
  secondarySuffix?: string;
  submitLabel: string;
  onSubmit: () => void;
  isSubmitDisabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
}

const BetControls = ({
  betAmount,
  onBetChange,
  secondaryValue,
  onSecondaryChange,
  secondaryLabel = "AUTO CASHOUT AT",
  secondarySuffix = "X",
  submitLabel,
  onSubmit,
  isSubmitDisabled = false,
  isLoading = false,
  variant = "primary"
}: BetControlsProps) => {
  const [betInput, setBetInput] = useState(betAmount.toString());
  const [secondaryInput, setSecondaryInput] = useState(
    secondaryValue ? secondaryValue.toString() : ""
  );
  const { playSound } = useSound();
  
  // Synchronize with parent component
  useEffect(() => {
    setBetInput(betAmount.toString());
  }, [betAmount]);
  
  useEffect(() => {
    if (secondaryValue !== undefined) {
      setSecondaryInput(secondaryValue.toString());
    }
  }, [secondaryValue]);
  
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetInput(e.target.value);
  };
  
  const handleSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondaryInput(e.target.value);
  };
  
  const handleBetBlur = () => {
    const value = parseInt(betInput);
    if (!isNaN(value) && value > 0) {
      onBetChange(value);
    } else {
      setBetInput(betAmount.toString());
    }
  };
  
  const handleSecondaryBlur = () => {
    if (!onSecondaryChange) return;
    
    const value = parseFloat(secondaryInput);
    if (!isNaN(value) && value > 0) {
      onSecondaryChange(value);
    } else if (secondaryValue) {
      setSecondaryInput(secondaryValue.toString());
    }
  };
  
  const handleIncrease = (type: 'bet' | 'secondary', amount: number) => {
    playSound(clickSound);
    
    if (type === 'bet') {
      const newValue = Math.max(10, betAmount + amount);
      onBetChange(newValue);
    } else if (onSecondaryChange && secondaryValue !== undefined) {
      const newValue = Math.max(1, secondaryValue + amount);
      onSecondaryChange(newValue);
    }
  };
  
  const handleDecrease = (type: 'bet' | 'secondary', amount: number) => {
    playSound(clickSound);
    
    if (type === 'bet') {
      const newValue = Math.max(10, betAmount - amount);
      onBetChange(newValue);
    } else if (onSecondaryChange && secondaryValue !== undefined) {
      const newValue = Math.max(1, secondaryValue - amount);
      onSecondaryChange(newValue);
    }
  };
  
  const handleSubmit = () => {
    playSound(clickSound);
    onSubmit();
  };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Bet Amount Block */}
      <div className="bg-gray-800 p-3 rounded">
        <div className="text-center text-gray-400 uppercase text-xs mb-2">
          BET AMOUNT
        </div>
        <div className="flex items-center justify-between">
          <button 
            className="bg-gray-700 hover:bg-gray-600 rounded-l px-3 py-1 text-xl font-bold"
            onClick={() => handleDecrease('bet', 10)}
            disabled={isLoading}
          >
            -
          </button>
          <input 
            type="text" 
            value={betInput} 
            onChange={handleBetChange}
            onBlur={handleBetBlur}
            className="bg-gray-700 text-white text-center font-pixel w-full mx-1 py-1 focus:outline-none"
            disabled={isLoading}
          />
          <button 
            className="bg-gray-700 hover:bg-gray-600 rounded-r px-3 py-1 text-xl font-bold"
            onClick={() => handleIncrease('bet', 10)}
            disabled={isLoading}
          >
            +
          </button>
        </div>
      </div>
      
      {/* Auto Cashout Block */}
      {onSecondaryChange && (
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-center text-gray-400 uppercase text-xs mb-2">
            {secondaryLabel}
          </div>
          <div className="flex items-center justify-between">
            <button 
              className="bg-gray-700 hover:bg-gray-600 rounded-l px-3 py-1 text-xl font-bold"
              onClick={() => handleDecrease('secondary', secondarySuffix === "X" ? 0.25 : 1)}
              disabled={isLoading}
            >
              -
            </button>
            <div className="flex items-center bg-gray-700 w-full mx-1 py-1">
              <input 
                type="text" 
                value={secondaryInput} 
                onChange={handleSecondaryChange}
                onBlur={handleSecondaryBlur}
                className="bg-gray-700 text-white text-center font-pixel w-full focus:outline-none"
                disabled={isLoading}
              />
              <span className="text-white font-pixel pr-2">{secondarySuffix}</span>
            </div>
            <button 
              className="bg-gray-700 hover:bg-gray-600 rounded-r px-3 py-1 text-xl font-bold"
              onClick={() => handleIncrease('secondary', secondarySuffix === "X" ? 0.25 : 1)}
              disabled={isLoading}
            >
              +
            </button>
          </div>
        </div>
      )}
      
      {/* Submit Button - Full Width */}
      <div className="col-span-2 mt-2">
        <PixelButton
          variant={variant}
          className="w-full py-3 font-pixel text-lg uppercase"
          onClick={handleSubmit}
          disabled={isSubmitDisabled || isLoading}
        >
          {isLoading ? "LOADING..." : submitLabel}
        </PixelButton>
      </div>
    </div>
  );
};

export default BetControls;
