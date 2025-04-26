import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PixelCard } from "@/components/ui/pixel-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const Leaderboard = () => {
  const [limit, setLimit] = useState(10);
  
  const { data: topPlayers, isLoading } = useQuery({
    queryKey: ['/api/leaderboard', limit],
  });
  
  // Get the rank icon based on position
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };
  
  return (
    <div>
      <h1 className="font-pixel text-2xl text-white mb-6">LEADERBOARD</h1>
      
      <PixelCard className="mb-8 p-4">
        <h2 className="font-pixel text-white text-lg mb-4">TOP PLAYERS</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-ui-medium font-pixel text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Winnings</th>
                <th className="px-4 py-3">Best Mult.</th>
              </tr>
            </thead>
            <tbody className="font-pixelText divide-y divide-ui-medium">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="bg-ui-dark">
                    <td className="px-4 py-3"><Skeleton className="h-6 w-8 bg-ui-medium" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24 bg-ui-medium" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 bg-ui-medium" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-12 bg-ui-medium" /></td>
                  </tr>
                ))
              ) : topPlayers && topPlayers.length > 0 ? (
                topPlayers.map((player: any, index: number) => (
                  <tr key={player.id} className="bg-ui-dark hover:bg-ui-medium">
                    <td className="px-4 py-3 text-accent font-pixel flex items-center gap-2">
                      {getRankIcon(index + 1)}
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3">{player.username}</td>
                    <td className="px-4 py-3 text-secondary">+{formatNumber(player.totalWinnings)}</td>
                    <td className="px-4 py-3">{player.bestMultiplier.toFixed(1)}x</td>
                  </tr>
                ))
              ) : (
                <tr className="bg-ui-dark">
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No players found. Be the first to reach the top!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PixelCard>
      
      <PixelCard className="p-4">
        <h2 className="font-pixel text-white text-lg mb-4">HOW TO CLIMB THE RANKS</h2>
        <div className="font-pixelText space-y-3 text-muted-foreground">
          <p>Play games and win big to increase your total winnings!</p>
          <p>The leaderboard tracks:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Total amount of Telegram Stars won across all games</li>
            <li>Your best multiplier from any game</li>
            <li>Only winnings from completed games count</li>
          </ul>
          <p className="text-accent">Leaderboard resets at the beginning of each month.</p>
        </div>
      </PixelCard>
    </div>
  );
};

export default Leaderboard;
