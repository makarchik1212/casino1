import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (soundSrc: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, HTMLAudioElement>>({});
  
  // Load mute preference from localStorage
  useEffect(() => {
    const storedMute = localStorage.getItem("dropnadoMuted");
    if (storedMute !== null) {
      setIsMuted(storedMute === "true");
    }
  }, []);
  
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem("dropnadoMuted", newMuted.toString());
  };
  
  const playSound = (soundSrc: string) => {
    if (isMuted) return;
    
    try {
      // Use cached audio element if available
      let audio = audioCache[soundSrc];
      
      if (!audio) {
        audio = new Audio(soundSrc);
        
        // Add to cache
        setAudioCache(prev => ({
          ...prev,
          [soundSrc]: audio
        }));
      }
      
      // Reset and play
      audio.currentTime = 0;
      audio.volume = 0.3; // Lower volume for better UX
      audio.play().catch(error => {
        console.error("Error playing sound:", error);
      });
      
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };
  
  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
