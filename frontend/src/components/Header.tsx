import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChefHat, Heart, History, LogIn, LogOut, Menu, MessageCircle, User, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  currentView: 'home' | 'history' | 'favorites' | 'chat';
  onNavigate: (view: 'home' | 'history' | 'favorites' | 'chat') => void;
  onLoginClick: () => void;
  isLoggedIn: boolean;
  userName?: string;
  onLogout: () => void;
}

export function Header({ currentView, onNavigate, onLoginClick, isLoggedIn, userName, onLogout }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Create', icon: ChefHat },
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-glow">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              SmartChef
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 gradient-warm rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Login/User Button */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{userName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="gap-2" onClick={onLoginClick}>
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {isLoggedIn ? (
              <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 mt-2" onClick={onLogout}>
                <LogOut className="w-5 h-5" />
                Logout ({userName})
              </Button>
            ) : (
              <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 mt-2" onClick={onLoginClick}>
                <LogIn className="w-5 h-5" />
                Login
              </Button>
            )}
          </motion.nav>
        )}
      </div>
    </header>
  );
}
