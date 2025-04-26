import { ReactNode, useEffect } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { toast } = useToast();
  const { user, login } = useAuth();
  
  // Auto-login with demo account for convenience
  useEffect(() => {
    if (!user) {
      // Try to login with demo account
      login("demo", "password")
        .catch(() => {
          toast({
            title: "Demo Login Failed",
            description: "You can register a new account to play.",
            variant: "destructive"
          });
        });
    }
  }, [user, login, toast]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="container mx-auto p-4 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
