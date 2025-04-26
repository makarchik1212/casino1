import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CrashGame from "@/pages/CrashGame";
import MinesGame from "@/pages/MinesGame";
import Leaderboard from "@/pages/Leaderboard";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
// Import the context providers directly in App
import { AuthProvider } from "./contexts/AuthContext";
import { SoundProvider } from "./contexts/SoundContext";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/crash" component={CrashGame} />
        <Route path="/mines" component={MinesGame} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/history" component={History} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Including AuthProvider and SoundProvider here as well as in main.tsx
  // This ensures the context is available everywhere
  return (
    <SoundProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SoundProvider>
  );
}

export default App;
