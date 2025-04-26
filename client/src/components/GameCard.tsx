import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";

interface GameCardProps {
  title: string;
  description: string;
  multiplierRange: string;
  imageSrc: string;
  path: string;
  isHot?: boolean;
  buttonVariant?: "primary" | "secondary";
}

const GameCard = ({
  title,
  description,
  multiplierRange,
  imageSrc,
  path,
  isHot = false,
  buttonVariant = "primary",
}: GameCardProps) => {
  return (
    <PixelCard className="relative group cursor-pointer h-full">
      {isHot && (
        <div className="absolute top-0 right-0 bg-primary px-3 py-1 font-pixel text-xs text-white z-10">
          HOT
        </div>
      )}
      
      <div 
        className="w-full h-40 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${imageSrc})`,
          imageRendering: 'pixelated' 
        }}
      />

      <div className="p-4">
        <h3 className="font-pixel text-white text-md mb-2">{title}</h3>
        <p className="font-pixelText text-gray-300 mb-3">{description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-accent font-pixel text-xs">{multiplierRange}</span>
          <Link href={path}>
            <PixelButton 
              variant={buttonVariant}
              size="sm"
              className="font-pixel"
            >
              PLAY NOW
            </PixelButton>
          </Link>
        </div>
      </div>
    </PixelCard>
  );
};

export default GameCard;
