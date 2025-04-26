import { useEffect } from "react";
import { useLocation } from "wouter";
import GameCard from "@/components/GameCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import crashGameCard from "@/assets/images/crash-game-card.png";

const Home = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Show welcome toast when first visiting
  useEffect(() => {
    if (user) {
      toast({
        title: "Welcome to Dropnado!",
        description: "Choose a game to start playing.",
      });
    }
  }, [user]);
  
  return (
    <div>
      <section className="mb-8">
        <h2 className="font-pixel text-accent text-lg mb-4">SELECT GAME</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Crash Game Card */}
          <GameCard
            title="CRASH GAME"
            description="Bet before the line crashes for big multipliers!"
            multiplierRange="1.5x - 100x"
            imageSrc={crashGameCard}
            path="/crash"
            isHot={true}
            buttonVariant="primary"
          />
          
          {/* Mines Game Card */}
          <GameCard
            title="MINES GAME"
            description="Avoid the mines, find the treasure!"
            multiplierRange="UP TO 9.5x"
            imageSrc="https://images.pexels.com/photos/2268539/pexels-photo-2268539.jpeg"
            path="/mines"
            buttonVariant="secondary"
          />
        </div>
      </section>
      
      <section className="mb-8">
        <div className="bg-ui-dark rounded-lg overflow-hidden pixel-border p-6 text-center">
          <h2 className="font-pixel text-accent text-xl mb-4">HOW TO PLAY</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div>
              <h3 className="font-pixel text-white text-md mb-2">CRASH GAME</h3>
              <ul className="font-pixelText text-gray-300 space-y-2 list-disc pl-5">
                <li>Place your bet before the round starts</li>
                <li>Watch the multiplier increase</li>
                <li>Cash out before it crashes to win</li>
                <li>The longer you wait, the higher the potential payout</li>
                <li>But be careful! If it crashes before you cash out, you lose your bet</li>
              </ul>
            </div>
            <div>
              <h3 className="font-pixel text-white text-md mb-2">MINES GAME</h3>
              <ul className="font-pixelText text-gray-300 space-y-2 list-disc pl-5">
                <li>Place your bet and choose the number of mines (1-24)</li>
                <li>Click on cells to reveal them</li>
                <li>Find gems to increase your multiplier</li>
                <li>Hit a mine and you lose your bet</li>
                <li>Cash out anytime to secure your winnings</li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <p className="font-pixelText text-accent">
              💰 New players get 1000 Telegram Stars to start! 💰
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
