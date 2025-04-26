import { Link } from "wouter";
import { Github, Twitter, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PixelButton } from "@/components/ui/pixel-button";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Show toast notification
    toast({
      title: "Subscribed!",
      description: "Thanks for subscribing to our newsletter!",
    });
    
    // Reset email
    setEmail("");
  };
  
  return (
    <footer className="bg-ui-dark border-t-4 border-ui-medium px-4 py-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-pixel text-accent text-sm mb-4">DROPNADO</h3>
            <p className="font-pixelText text-gray-400 text-sm mb-4">
              The most exciting retro-style crypto casino. Play, win, and climb the leaderboards!
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-accent">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white hover:text-accent">
                <Github size={20} />
              </a>
              <a href="#" className="text-white hover:text-accent">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-pixel text-accent text-sm mb-4">QUICK LINKS</h3>
            <ul className="font-pixelText text-gray-400 space-y-2">
              <li><Link href="/"><span className="hover:text-white cursor-pointer">• Games</span></Link></li>
              <li><Link href="/leaderboard"><span className="hover:text-white cursor-pointer">• Leaderboard</span></Link></li>
              <li><Link href="/history"><span className="hover:text-white cursor-pointer">• Game History</span></Link></li>
              <li><Link href="/profile"><span className="hover:text-white cursor-pointer">• Profile</span></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-pixel text-accent text-sm mb-4">NEWSLETTER</h3>
            <p className="font-pixelText text-gray-400 text-sm mb-4">
              Subscribe for exclusive bonuses and updates!
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="bg-dark text-white w-full font-pixelText focus:ring-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <PixelButton type="submit" variant="primary" size="sm">GO</PixelButton>
            </form>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-ui-medium text-center">
          <p className="font-pixelText text-gray-500 text-sm">
            © 2025 Dropnado. All rights reserved. Must be 18+ to play. Play responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
