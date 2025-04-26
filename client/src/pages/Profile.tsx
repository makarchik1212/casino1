import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { PixelCard } from "@/components/ui/pixel-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PixelButton } from "@/components/ui/pixel-button";
import { formatNumber } from "@/lib/utils";
import { User, Volume2, VolumeX, UserPlus, LogOut } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import clickSound from "@/assets/sounds/click";

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(4, { message: "Password must be at least 4 characters" }),
});

const loginSchema = registerSchema;

const Profile = () => {
  const { user, login, register, logout, isLoading } = useAuth();
  const { isMuted, toggleMute, playSound } = useSound();
  const { toast } = useToast();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const handleToggleMute = () => {
    playSound(clickSound);
    toggleMute();
  };
  
  const handleToggleMode = () => {
    playSound(clickSound);
    setIsRegisterMode(!isRegisterMode);
  };
  
  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      await register(values.username, values.password);
      registerForm.reset();
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };
  
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values.username, values.password);
      loginForm.reset();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  const handleLogout = () => {
    playSound(clickSound);
    logout();
  };
  
  // User profile view
  if (user) {
    return (
      <div>
        <h1 className="font-pixel text-2xl text-white mb-6">YOUR PROFILE</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PixelCard className="p-6 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-24 h-24 rounded-full mb-4 flex items-center justify-center font-pixel text-3xl"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              
              <h2 className="font-pixel text-xl text-white mb-2">{user.username}</h2>
              <p className="font-pixelText text-muted-foreground mb-4">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </p>
              
              <div className="bg-ui-medium px-6 py-4 rounded w-full mb-6">
                <p className="font-pixel text-accent text-sm mb-1">BALANCE</p>
                <p className="font-pixel text-2xl">{formatNumber(user.balance)} STARS</p>
              </div>
              
              <PixelButton 
                variant="outline" 
                className="w-full font-pixel mb-3 flex items-center justify-center gap-2"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                LOGOUT
              </PixelButton>
            </div>
          </PixelCard>
          
          <PixelCard className="p-6 lg:col-span-2">
            <h2 className="font-pixel text-white text-lg mb-4">SETTINGS</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-ui-medium p-4 rounded">
                <div className="space-y-0.5">
                  <div className="font-pixel text-white">Sound Effects</div>
                  <div className="text-sm text-muted-foreground font-pixelText">
                    Enable game sounds and effects
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  <Switch 
                    checked={!isMuted} 
                    onCheckedChange={handleToggleMute}
                  />
                </div>
              </div>
              
              <div className="bg-ui-medium p-4 rounded">
                <h3 className="font-pixel text-white mb-3">Game Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-ui-dark p-3 rounded text-center">
                    <p className="font-pixelText text-muted-foreground text-sm">Crash Wins</p>
                    <p className="font-pixel text-accent">12</p>
                  </div>
                  <div className="bg-ui-dark p-3 rounded text-center">
                    <p className="font-pixelText text-muted-foreground text-sm">Mines Wins</p>
                    <p className="font-pixel text-accent">8</p>
                  </div>
                  <div className="bg-ui-dark p-3 rounded text-center">
                    <p className="font-pixelText text-muted-foreground text-sm">Avg. Multiplier</p>
                    <p className="font-pixel text-accent">2.45x</p>
                  </div>
                  <div className="bg-ui-dark p-3 rounded text-center">
                    <p className="font-pixelText text-muted-foreground text-sm">Best Streak</p>
                    <p className="font-pixel text-accent">4</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-ui-medium p-4 rounded">
                <h3 className="font-pixel text-white mb-3">Achievements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-ui-dark p-2 rounded flex items-center">
                    <div className="bg-accent w-8 h-8 rounded flex items-center justify-center mr-2">
                      <span className="font-pixel text-black">1</span>
                    </div>
                    <span className="font-pixelText">First Win</span>
                  </div>
                  <div className="bg-ui-dark p-2 rounded flex items-center opacity-50">
                    <div className="bg-ui-medium w-8 h-8 rounded flex items-center justify-center mr-2">
                      <span className="font-pixel">?</span>
                    </div>
                    <span className="font-pixelText">10x Multiplier</span>
                  </div>
                  <div className="bg-ui-dark p-2 rounded flex items-center opacity-50">
                    <div className="bg-ui-medium w-8 h-8 rounded flex items-center justify-center mr-2">
                      <span className="font-pixel">?</span>
                    </div>
                    <span className="font-pixelText">Win Streak</span>
                  </div>
                  <div className="bg-ui-dark p-2 rounded flex items-center opacity-50">
                    <div className="bg-ui-medium w-8 h-8 rounded flex items-center justify-center mr-2">
                      <span className="font-pixel">?</span>
                    </div>
                    <span className="font-pixelText">High Roller</span>
                  </div>
                </div>
              </div>
            </div>
          </PixelCard>
        </div>
      </div>
    );
  }
  
  // Login/Register view
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <PixelCard className="p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="font-pixel text-2xl text-white mb-2">
            {isRegisterMode ? "CREATE ACCOUNT" : "LOGIN"}
          </h1>
          <p className="font-pixelText text-muted-foreground">
            {isRegisterMode 
              ? "Join Pixel Casino and get 1000 free Telegram Stars!" 
              : "Login to your account to start playing"}
          </p>
        </div>
        
        {isRegisterMode ? (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-pixel text-white">USERNAME</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter username" 
                        className="font-pixelText bg-ui-dark border-ui-medium" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="font-pixelText text-primary" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-pixel text-white">PASSWORD</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter password" 
                        className="font-pixelText bg-ui-dark border-ui-medium" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="font-pixelText text-primary" />
                  </FormItem>
                )}
              />
              
              <PixelButton 
                type="submit" 
                className="w-full font-pixel mt-6 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <UserPlus size={16} />
                {isLoading ? "CREATING..." : "CREATE ACCOUNT"}
              </PixelButton>
            </form>
          </Form>
        ) : (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-pixel text-white">USERNAME</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter username" 
                        className="font-pixelText bg-ui-dark border-ui-medium" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="font-pixelText text-primary" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-pixel text-white">PASSWORD</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter password" 
                        className="font-pixelText bg-ui-dark border-ui-medium" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="font-pixelText text-primary" />
                  </FormItem>
                )}
              />
              
              <PixelButton 
                type="submit" 
                className="w-full font-pixel mt-6 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <User size={16} />
                {isLoading ? "LOGGING IN..." : "LOGIN"}
              </PixelButton>
            </form>
          </Form>
        )}
        
        <div className="mt-6 text-center">
          <button 
            onClick={handleToggleMode}
            className="font-pixelText text-accent hover:underline"
          >
            {isRegisterMode 
              ? "Already have an account? Login" 
              : "Don't have an account? Create one"}
          </button>
        </div>
      </PixelCard>
    </div>
  );
};

export default Profile;
