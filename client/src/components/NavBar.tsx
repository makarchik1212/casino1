import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import StarIcon from "@/assets/icons/StarIcon";
import { cn, formatNumber } from "@/lib/utils";

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const navLinks = [
    { name: "GAMES", path: "/" },
    { name: "LEADERBOARD", path: "/leaderboard" },
    { name: "HISTORY", path: "/history" },
    { name: "PROFILE", path: "/profile" }
  ];
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <header>
      <nav className="bg-dark border-b-4 border-ui-dark px-4 py-3">
        <div className="container mx-auto flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-2">
            <StarIcon />
            <Link href="/">
              <span className="font-pixel text-accent text-lg cursor-pointer">DROPNADO</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
              >
                <span className={cn(
                  "text-white hover:text-accent font-pixel text-xs cursor-pointer",
                  location === link.path && "text-accent"
                )}>
                  {link.name}
                </span>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="bg-ui-dark px-3 py-2 rounded flex items-center">
                <span className="text-accent font-pixel text-sm mr-2">
                  {formatNumber(user.balance)}
                </span>
                <StarIcon />
              </div>
            )}
            <button 
              className="md:hidden text-white"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation Menu */}
      <div className={cn(
        "md:hidden bg-ui-dark border-b-4 border-accent",
        !mobileMenuOpen && "hidden"
      )}>
        <div className="container mx-auto py-3 px-4">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
              >
                <span 
                  className={cn(
                    "text-white hover:text-accent font-pixel text-xs py-2 cursor-pointer",
                    location === link.path && "text-accent"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </span>
              </Link>
            ))}
            {user && (
              <button 
                className="text-white hover:text-accent font-pixel text-xs py-2 text-left"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                LOGOUT
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
