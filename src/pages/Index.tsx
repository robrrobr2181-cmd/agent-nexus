import { useState, useEffect } from "react";
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase";
import { Chat } from "./Chat";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Brain, Zap } from "lucide-react";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async (email: string, password: string, isSignUp: boolean) => {
    if (isSignUp) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  };

  const handleGoogleAuth = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-subtle">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Chat user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-24 h-24 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center shadow-glow">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Multi-Agent AI Assistant
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Powered by specialized AI agents that work together to handle your requests intelligently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-agent-concierge/50 transition-all hover:shadow-elevated">
              <Sparkles className="w-8 h-8 text-agent-concierge mb-3" />
              <h3 className="font-semibold mb-2 text-foreground">Concierge</h3>
              <p className="text-sm text-muted-foreground">Plans and recommendations</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-agent-search/50 transition-all hover:shadow-elevated">
              <Brain className="w-8 h-8 text-agent-search mb-3" />
              <h3 className="font-semibold mb-2 text-foreground">Search</h3>
              <p className="text-sm text-muted-foreground">Knowledge retrieval</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-agent-workflow/50 transition-all hover:shadow-elevated">
              <Zap className="w-8 h-8 text-agent-workflow mb-3" />
              <h3 className="font-semibold mb-2 text-foreground">Workflow</h3>
              <p className="text-sm text-muted-foreground">Task automation</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-agent-expert/50 transition-all hover:shadow-elevated">
              <Bot className="w-8 h-8 text-agent-expert mb-3" />
              <h3 className="font-semibold mb-2 text-foreground">Expert</h3>
              <p className="text-sm text-muted-foreground">Domain expertise</p>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button
              onClick={() => setAuthModalOpen(true)}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-primary hover:shadow-glow transition-all"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onEmailAuth={handleEmailAuth}
        onGoogleAuth={handleGoogleAuth}
      />
    </div>
  );
};

export default Index;
