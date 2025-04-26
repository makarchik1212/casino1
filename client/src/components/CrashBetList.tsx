import React from 'react';
import { formatMultiplier, getUserInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Bet {
  id: number;
  userId: number;
  username: string;
  betAmount: number;
  cashedOutAt?: number | null;
  autoCashoutAt?: number | null;
  avatarColor: string;
}

interface CrashBetListProps {
  bets: Bet[];
  currentMultiplier: number;
}

const CrashBetList = ({ bets, currentMultiplier }: CrashBetListProps) => {
  if (!bets || bets.length === 0) {
    return (
      <div className="w-full py-4 text-center text-gray-500 font-pixel">
        Ожидание ставок игроков...
      </div>
    );
  }

  return (
    <div className="w-full max-h-[250px] overflow-auto scrollbar-cobalt">
      <table className="w-full border-collapse">
        <thead className="bg-ui-dark sticky top-0 z-10">
          <tr>
            <th className="text-left p-2 font-pixel text-xs text-gray-400">Игрок</th>
            <th className="text-center p-2 font-pixel text-xs text-gray-400">Ставка</th>
            <th className="text-right p-2 font-pixel text-xs text-gray-400">Выигрыш</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((bet) => {
            // Рассчитываем текущий потенциальный выигрыш
            const cashoutMultiplier = bet.cashedOutAt !== null && bet.cashedOutAt !== undefined ? 
                                      Number(bet.cashedOutAt) : currentMultiplier;
            const winAmount = Math.floor(bet.betAmount * cashoutMultiplier);
            const profit = winAmount - bet.betAmount;
            const isCashedOut = bet.cashedOutAt !== null && bet.cashedOutAt !== undefined;
            
            return (
              <tr 
                key={bet.id} 
                className={cn(
                  "border-b border-ui-medium transition-colors",
                  isCashedOut && "bg-gray-900/50",
                  isCashedOut && "opacity-70"
                )}
              >
                <td className="p-2 flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-gray-200"
                    style={{ backgroundColor: bet.avatarColor }}
                  >
                    {getUserInitials(bet.username)}
                  </div>
                  <span className="font-pixel text-sm text-gray-200">{bet.username}</span>
                </td>
                <td className="p-2 text-center">
                  <span className="font-pixel text-sm text-gray-200">{bet.betAmount}</span>
                </td>
                <td className="p-2 text-right">
                  {isCashedOut ? (
                    <div className="flex flex-col items-end">
                      <span className="font-pixel text-sm text-green-500">
                        {bet.cashedOutAt ? formatMultiplier(bet.cashedOutAt) : "0.00"}x
                      </span>
                      <span className="font-pixel text-xs text-green-400">
                        +{profit}
                      </span>
                    </div>
                  ) : (
                    <div className="font-pixel text-sm text-gray-200 animate-pulse-slow">
                      {winAmount} (+{profit})
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CrashBetList;