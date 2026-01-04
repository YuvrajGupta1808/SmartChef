import { Button } from "@/components/ui/button";
import { sampleRecipes } from "@/data/sampleRecipes";
import type { Recipe, RecipeType } from "@/types/recipe";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Clock, MapPin, Search, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { RecipeTypeToggle } from "./RecipeTypeToggle";

interface HeroSectionProps {
  recipeType: RecipeType;
  onRecipeTypeChange: (type: RecipeType) => void;
  onSearch: (query: string, location: string) => void;
  onSelectSampleRecipe?: (recipe: Recipe) => void;
  isLoading?: boolean;
}

const rotatingPhrases = [
  "Creamy Pasta Carbonara...",
  "Spicy Chicken Tikka Masala...",
  "Crispy Beef Tacos...",
  "Authentic Pad Thai...",
  "Classic Margherita Pizza...",
  "Rich Chocolate Cake...",
  "Fresh Caesar Salad...",
  "Savory Beef Stew...",
];

export function HeroSection({
  recipeType,
  onRecipeTypeChange,
  onSearch,
  onSelectSampleRecipe,
  isLoading,
}: HeroSectionProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("San Francisco, CA");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    if (query) return; // Stop rotating when user types
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [query]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim(), location);
    }
  };

  const handleSurpriseMe = () => {
    const randomDish = rotatingPhrases[Math.floor(Math.random() * rotatingPhrases.length)].replace("...", "");
    setQuery(randomDish);
    onSearch(randomDish, location);
  };

  return (
    <section className="relative py-12 md:py-20 overflow-hidden min-h-[70vh] flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-luxury/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Animated Title */}
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            <motion.span
              className="inline-block"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--luxury)), hsl(var(--primary)))",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SmartChef
            </motion.span>
          </motion.h1>
          
          <motion.p
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            AI-powered recipes with real-time pricing. Choose budget-friendly or
            luxury ingredients.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <RecipeTypeToggle value={recipeType} onChange={onRecipeTypeChange} />
          </motion.div>
        </motion.div>

        {/* Search Bar with rotating placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-3xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="flex items-center gap-3 px-4 py-4">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full bg-transparent border-none outline-none text-foreground text-lg font-medium relative z-10"
                      placeholder=""
                    />
                    {!query && (
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={currentPhraseIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="text-muted-foreground text-lg"
                          >
                            {rotatingPhrases[currentPhraseIndex]}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-border" />

              {/* Location */}
              <div className="flex items-center gap-2 px-4 py-3 min-w-[160px]">
                <MapPin className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-sm"
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
        </motion.div>

        {/* Example Recipes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-10 max-w-5xl mx-auto"
        >
          <h2 className="text-center text-lg font-display font-semibold text-muted-foreground mb-6">
            Popular Recipes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="glass-card rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => {
                  if (onSelectSampleRecipe) {
                    onSelectSampleRecipe(recipe);
                  }
                }}
              >
                {/* Recipe Image */}
                <div className="relative h-36 overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${recipe.type === 'budget' ? 'bg-budget-light text-budget' : 'bg-luxury-light text-luxury'}`}>
                      {recipe.type === 'budget' ? '💰' : '✨'}
                    </span>
                    {/* Chef caps for difficulty */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <ChefHat key={i} className={`w-3 h-3 ${i < recipe.difficulty ? 'text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-sm mb-2 line-clamp-1">{recipe.name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.prepTime + recipe.cookTime} min
                    </span>
                    <span className={`font-medium ${recipe.type === 'budget' ? 'text-budget' : 'text-luxury'}`}>
                      ${recipe.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
