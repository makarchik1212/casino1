import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { PixelCard } from "@/components/ui/pixel-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo, formatProfit } from "@/lib/utils";
import { Bomb, Zap } from "lucide-react";
import { PixelButton } from "@/components/ui/pixel-button";

const History = () => {
  const { user } = useAuth();
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  
  const { data: history, isLoading } = useQuery({
    queryKey: ['/api/history/' + (user?.id || 0), limit, page],
    enabled: !!user,
  });
  
  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
  };
  
  const getGameIcon = (gameType: string) => {
    if (gameType === "crash") {
      return <Zap className="h-4 w-4 mr-1 text-primary" />;
    } else if (gameType === "mines") {
      return <Bomb className="h-4 w-4 mr-1 text-secondary" />;
    }
    return null;
  };
  
  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <PixelCard className="p-6 max-w-md text-center">
          <h2 className="font-pixel text-xl text-white mb-4">LOGIN REQUIRED</h2>
          <p className="font-pixelText text-muted-foreground mb-4">
            You need to be logged in to view your game history.
          </p>
          <div className="pixel-border p-4 bg-ui-medium mb-4">
            <p className="font-pixel text-accent">
              LOGIN TO TRACK YOUR GAMES!
            </p>
          </div>
        </PixelCard>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="font-pixel text-2xl text-white mb-6">YOUR GAME HISTORY</h1>
      
      <PixelCard className="mb-8 p-4">
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="bg-ui-dark">
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 bg-ui-medium" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24 bg-ui-medium" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-12 bg-ui-medium" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-12 bg-ui-medium" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 bg-ui-medium" /></td>
                  </tr>
                ))
              ) : history && history.length > 0 ? (
                history.map((game: any) => {
                  const { text, colorClass } = formatProfit(game.profit);
                  return (
                    <tr key={game.id} className="bg-ui-dark hover:bg-ui-medium">
                      <td className="px-4 py-3 flex items-center">
                        {getGameIcon(game.gameType)}
                        <span className="capitalize">{game.gameType}</span>
                      </td>
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
        
        {history && history.length >= limit && (
          <div className="mt-6 text-center">
            <PixelButton 
              variant="outline" 
              onClick={handleLoadMore}
              className="font-pixel"
            >
              LOAD MORE
            </PixelButton>
          </div>
        )}
      </PixelCard>
      
      <PixelCard className="p-4">
        <h2 className="font-pixel text-white text-lg mb-4">GAME STATS</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-ui-medium p-4 rounded">
                <Skeleton className="h-16 w-full bg-ui-dark" />
              </div>
            ))}
          </div>
        ) : history ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-ui-medium p-4 rounded text-center">
              <h3 className="font-pixel text-accent text-sm mb-2">TOTAL GAMES</h3>
              <p className="font-pixel text-white text-2xl">{history.length}</p>
            </div>
            
            <div className="bg-ui-medium p-4 rounded text-center">
              <h3 className="font-pixel text-accent text-sm mb-2">WINS / LOSSES</h3>
              <p className="font-pixel text-white text-2xl">
                {history.filter((game: any) => game.profit > 0).length} / {history.filter((game: any) => game.profit <= 0).length}
              </p>
            </div>
            
            <div className="bg-ui-medium p-4 rounded text-center">
              <h3 className="font-pixel text-accent text-sm mb-2">BEST MULTIPLIER</h3>
              <p className="font-pixel text-white text-2xl">
                {history.length > 0 
                  ? Math.max(...history.map((game: any) => game.multiplier)).toFixed(2) + 'x'
                  : '0.00x'}
              </p>
            </div>
          </div>
        ) : null}
      </PixelCard>
    </div>
  );
};

export default History;
