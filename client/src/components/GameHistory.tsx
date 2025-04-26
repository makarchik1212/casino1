import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { formatTimeAgo, formatProfit } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GameHistoryProps {
  limit?: number;
  showPagination?: boolean;
}

const GameHistory = ({ limit = 5, showPagination = false }: GameHistoryProps) => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  
  const { data: history, isLoading } = useQuery({
    queryKey: ['/api/history/' + (user?.id || 0), limit],
    enabled: !!user,
  });
  
  if (!user) {
    return (
      <div className="bg-ui-dark rounded-lg overflow-hidden pixel-border p-4">
        <h2 className="font-pixel text-white text-lg mb-4">YOUR GAME HISTORY</h2>
        <p className="text-muted-foreground">Please log in to view your game history.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="bg-ui-dark rounded-lg overflow-hidden pixel-border p-4">
        <h2 className="font-pixel text-white text-lg mb-4">YOUR GAME HISTORY</h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full">
              <Skeleton className="h-12 bg-ui-medium" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-ui-dark rounded-lg overflow-hidden pixel-border p-4">
      <h2 className="font-pixel text-white text-lg mb-4">YOUR GAME HISTORY</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-ui-medium font-pixel text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Bet</th>
              <th className="px-4 py-3">Mult.</th>
              <th className="px-4 py-3">Profit</th>
            </tr>
          </thead>
          <tbody className="font-pixelText divide-y divide-ui-medium">
            {history && history.length > 0 ? (
              history.map((game: any) => {
                const { text, colorClass } = formatProfit(game.profit);
                return (
                  <tr key={game.id} className="bg-ui-dark hover:bg-ui-medium">
                    <td className="px-4 py-3 capitalize">{game.gameType}</td>
                    <td className="px-4 py-3">{formatTimeAgo(new Date(game.timestamp))}</td>
                    <td className="px-4 py-3">{game.betAmount}</td>
                    <td className="px-4 py-3">{game.multiplier.toFixed(2)}x</td>
                    <td className={`px-4 py-3 ${colorClass}`}>{text}</td>
                  </tr>
                );
              })
            ) : (
              <tr className="bg-ui-dark">
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No game history yet. Start playing to see your results here!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {showPagination && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            className="font-pixel"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="font-pixel text-xs">Page {page}</span>
          <Button
            variant="outline"
            className="font-pixel"
            onClick={() => setPage(page + 1)}
            disabled={history && history.length < limit}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameHistory;
