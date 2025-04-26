import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  balance: number;
  avatarColor: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("pixelCasinoUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("pixelCasinoUser");
      }
    }
  }, []);
  
  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/login", { username, password });
      const userData = await res.json();
      
      setUser(userData);
      localStorage.setItem("pixelCasinoUser", JSON.stringify(userData));
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.username}`,
      });
      
      return userData;
    } catch (error) {
      console.error("Login failed", error);
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Generate random color for avatar
      const colors = ["#FF5757", "#4CD964", "#FFD700", "#5AC8FA", "#FF9500", "#CC73E1"];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];
      
      const res = await apiRequest("POST", "/api/register", { 
        username, 
        password,
        avatarColor 
      });
      const userData = await res.json();
      
      setUser(userData);
      localStorage.setItem("pixelCasinoUser", JSON.stringify(userData));
      
      toast({
        title: "Welcome to Pixel Casino!",
        description: `Registered as ${userData.username}`,
      });
      
      return userData;
    } catch (error) {
      console.error("Registration failed", error);
      toast({
        title: "Registration Failed",
        description: "Username may already be taken",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("pixelCasinoUser");
    
    toast({
      title: "Logged out",
      description: "Come back soon!",
    });
  };
  
  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem("pixelCasinoUser", JSON.stringify(updatedUser));
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout,
      updateUserBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
