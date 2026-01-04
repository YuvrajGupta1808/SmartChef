import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Mic, Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string, location: string) => void;
  isLoading?: boolean;
}

const popularDishes = [
  "Pasta Carbonara",
  "Chicken Tikka Masala",
  "Beef Tacos",
  "Pad Thai",
  "Margherita Pizza",
];

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("New York, NY");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim(), location);
      setShowSuggestions(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomDish = popularDishes[Math.floor(Math.random() * popularDishes.length)];
    setQuery(randomDish);
    onSearch(randomDish, location);
  };

  const filteredSuggestions = query
    ? popularDishes.filter(dish => 
        dish.toLowerCase().includes(query.toLowerCase())
      )
    : popularDishes;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-card rounded-2xl p-2 shadow-lg">
        {/* Main search input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="What do you want to cook?"
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg font-medium"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => {}}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                title="Voice search"
              >
                <Mic className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* Location */}
          <div className="flex items-center gap-2 px-4 py-3 min-w-[180px]">
            <MapPin className="w-5 h-5 text-primary" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>

          {/* Search button */}
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            variant="hero"
            size="lg"
            className="rounded-xl"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Search className="w-5 h-5" />
              </motion.div>
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border mt-2 pt-3 pb-2 px-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  {query ? "Suggestions" : "Popular dishes"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {filteredSuggestions.map((dish) => (
                    <button
                      key={dish}
                      onClick={() => {
                        setQuery(dish);
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-accent transition-colors"
                    >
                      {dish}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Surprise me button */}
      <div className="flex justify-center mt-4">
        <Button
          variant="ghost"
          onClick={handleSurpriseMe}
          className="text-muted-foreground hover:text-foreground"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Surprise me
        </Button>
      </div>
    </div>
  );
}
