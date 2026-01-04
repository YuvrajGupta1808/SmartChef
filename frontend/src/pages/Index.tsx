import { ChatView } from "@/components/ChatView";
import { GeneratedRecipeCard } from "@/components/GeneratedRecipeCard";
import { GenerationLoader } from "@/components/GenerationLoader";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { LoginModal } from "@/components/LoginModal";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { sampleRecipes } from "@/data/sampleRecipes";
import { authApi, chatApi } from "@/lib/api";
import { restoreImagesInMarkdown, saveImagesFromMarkdown } from "@/lib/imageStorage";
import type { Recipe, RecipeType } from "@/types/recipe";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Clock, Filter, Heart, Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface GeneratedRecipe {
  id: string;
  markdown: string;
  recipeType: RecipeType;
  name: string;
  image?: string;
  totalTime?: number;
  totalCost?: number;
  isFavorite: boolean;
  createdAt: Date;
}

// Helper to extract recipe name from markdown
function extractRecipeName(markdown: string): string {
  const nameMatch = markdown.match(/^#{1,2}\s*(.+?)(?:\s*[-–]\s*(?:Budget|Luxury)\s*Version)?$/m);
  return nameMatch ? nameMatch[1].trim().replace(/^#\s*/, '') : "Generated Recipe";
}

// Helper to extract main dish image from markdown
function extractRecipeImage(markdown: string): string | undefined {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imageMatch;
  const foundImages: { alt: string; url: string }[] = [];
  
  while ((imageMatch = imageRegex.exec(markdown)) !== null) {
    foundImages.push({ alt: imageMatch[1], url: imageMatch[2] });
  }
  
  for (const img of foundImages) {
    const alt = img.alt.toLowerCase();
    // Prefer final dish image
    if (alt.includes('final') || alt.includes('dish') || alt.includes('plated') || alt.includes('finished')) {
      return img.url;
    }
  }
  // Fallback to last image (usually the final dish)
  if (foundImages.length > 0) {
    return foundImages[foundImages.length - 1]?.url;
  }
  return undefined;
}

// Helper to extract total time from markdown
function extractTotalTime(markdown: string): number | undefined {
  const totalMatch = markdown.match(/\*?\*?Total(?:\s*Time)?\*?\*?[:\s]*(\d+)\s*min/i);
  if (totalMatch) return parseInt(totalMatch[1]);
  
  const prepMatch = markdown.match(/\*?\*?Prep(?:\s*Time)?\*?\*?[:\s]*(\d+)\s*min/i);
  const cookMatch = markdown.match(/\*?\*?Cook(?:\s*Time)?\*?\*?[:\s]*(\d+)\s*min/i);
  const prep = prepMatch ? parseInt(prepMatch[1]) : 0;
  const cook = cookMatch ? parseInt(cookMatch[1]) : 0;
  return prep + cook || undefined;
}

// Helper to extract total cost from markdown
function extractTotalCost(markdown: string): number | undefined {
  const costMatch = markdown.match(/(?:Estimated\s*)?(?:Total\s*)?Cost[:\s]*\$?([\d.]+)/i);
  return costMatch ? parseFloat(costMatch[1]) : undefined;
}

export default function Index() {
  const [currentView, setCurrentView] = useState<'home' | 'history' | 'favorites' | 'chat'>('home');
  const [recipeType, setRecipeType] = useState<RecipeType>('budget');
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedRecipeMarkdown, setGeneratedRecipeMarkdown] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  
  // Generated recipes history - with migration for old recipes
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>(() => {
    const saved = localStorage.getItem("generatedRecipes");
    if (!saved) return [];
    
    const recipes: GeneratedRecipe[] = JSON.parse(saved);
    // Migrate old recipes that don't have image/cost/time
    return recipes.map(recipe => {
      if (!recipe.image && recipe.markdown) {
        return {
          ...recipe,
          image: extractRecipeImage(recipe.markdown),
          totalTime: extractTotalTime(recipe.markdown),
          totalCost: extractTotalCost(recipe.markdown),
        };
      }
      return recipe;
    });
  });
  const [currentGeneratedRecipeId, setCurrentGeneratedRecipeId] = useState<string | null>(null);
  
  // Auth state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Save generated recipes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("generatedRecipes", JSON.stringify(generatedRecipes));
    } catch (e) {
      console.warn("Could not save recipes to localStorage:", e);
    }
  }, [generatedRecipes]);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authApi.getMe(token)
        .then((response) => setUser(response.user))
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  const generateRecipe = async (query: string, location: string) => {
    console.log('[generateRecipe] Starting generation for:', query, location);
    setIsGenerating(true);
    setSelectedRecipe(null);
    setGeneratedRecipeMarkdown(null);
    setSearchQuery(query);
    setGenerationStatus("Starting recipe generation...");

    const newRecipeId = `generated-${Date.now()}`;
    setCurrentGeneratedRecipeId(newRecipeId);

    try {
      // Build the message for the agent
      const recipeMessage = recipeType === 'luxury' 
        ? `luxury ${query} for ${location}`
        : `${query} for ${location}`;

      console.log('[generateRecipe] Sending message:', recipeMessage);
      let fullResponse = "";

      await chatApi.streamMessage(
        recipeMessage,
        undefined,
        (status) => {
          console.log('[generateRecipe] Status:', status);
          setGenerationStatus(status);
        },
        (text) => {
          console.log('[generateRecipe] Text chunk received, length:', text.length);
          fullResponse += text;
          setGeneratedRecipeMarkdown(fullResponse);
        },
        () => {
          console.log('[generateRecipe] Done! Full response length:', fullResponse.length);
          setIsGenerating(false);
          setGenerationStatus("");
          
          // Save to history only for logged-in users
          if (user && fullResponse && !fullResponse.includes("Error")) {
            // Save images to IndexedDB and get markdown with references
            saveImagesFromMarkdown(newRecipeId, fullResponse).then(({ markdown: storedMarkdown }) => {
              const newGeneratedRecipe: GeneratedRecipe = {
                id: newRecipeId,
                markdown: storedMarkdown, // Markdown with IndexedDB image references
                recipeType: recipeType,
                name: extractRecipeName(fullResponse),
                image: extractRecipeImage(fullResponse), // Keep thumbnail for history grid
                totalTime: extractTotalTime(fullResponse),
                totalCost: extractTotalCost(fullResponse),
                isFavorite: false,
                createdAt: new Date(),
              };
              setGeneratedRecipes(prev => [newGeneratedRecipe, ...prev]);
            });
          }
        },
        (error) => {
          console.error("[generateRecipe] Error:", error);
          setIsGenerating(false);
          setGenerationStatus("");
          setGeneratedRecipeMarkdown("Error generating recipe. Please try again.");
        },
        true // Include images for home page requests
      );
    } catch (error) {
      console.error("[generateRecipe] Catch error:", error);
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  const handleSearch = (query: string, location: string) => {
    console.log('Searching:', query, 'at', location, 'type:', recipeType);
    generateRecipe(query, location);
  };

  const handleAuthSuccess = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem("token", token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  const toggleFavorite = (id: string) => {
    setRecipes(prev =>
      prev.map(r =>
        r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const toggleGeneratedFavorite = (id: string) => {
    setGeneratedRecipes(prev =>
      prev.map(r =>
        r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
  };

  // Get current generated recipe's favorite status
  const currentGeneratedRecipe = currentGeneratedRecipeId 
    ? generatedRecipes.find(r => r.id === currentGeneratedRecipeId)
    : null;

  const filteredRecipes = currentView === 'favorites'
    ? recipes.filter(r => r.isFavorite)
    : recipes;

  // Filter generated recipes for favorites view
  const filteredGeneratedRecipes = currentView === 'favorites'
    ? generatedRecipes.filter(r => r.isFavorite)
    : generatedRecipes;

  const handleBackToSearch = () => {
    setSelectedRecipe(null);
    setGeneratedRecipeMarkdown(null);
    setSearchQuery("");
  };

  const handleNavigate = (view: 'home' | 'history' | 'favorites' | 'chat') => {
    if (view === 'home') {
      // Reset to initial home state
      setSelectedRecipe(null);
      setGeneratedRecipeMarkdown(null);
      setSearchQuery("");
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentView={currentView} 
        onNavigate={handleNavigate}
        onLoginClick={() => setIsLoginModalOpen(true)}
        isLoggedIn={!!user}
        userName={user?.name}
        onLogout={handleLogout}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <AnimatePresence mode="wait">
        {currentView === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChatView 
              isLoggedIn={!!user} 
              onLoginClick={() => setIsLoginModalOpen(true)} 
            />
          </motion.div>
        )}

        {currentView === 'home' && !isGenerating && !selectedRecipe && !generatedRecipeMarkdown && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HeroSection
              recipeType={recipeType}
              onRecipeTypeChange={setRecipeType}
              onSearch={handleSearch}
              onSelectSampleRecipe={(recipe) => setSelectedRecipe(recipe)}
              isLoading={isGenerating}
            />
          </motion.div>
        )}

        {currentView === 'home' && isGenerating && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12"
          >
            <GenerationLoader query={searchQuery} status={generationStatus} />
          </motion.div>
        )}

        {currentView === 'home' && generatedRecipeMarkdown && !isGenerating && (
          <motion.div
            key="generated-recipe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <Button
              variant="ghost"
              onClick={handleBackToSearch}
              className="mb-6"
            >
              ← Back to Search
            </Button>
            <div className="max-w-4xl mx-auto">
              <GeneratedRecipeCard
                markdown={generatedRecipeMarkdown}
                recipeType={recipeType}
                onFavorite={() => {
                  if (!user) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  if (currentGeneratedRecipeId) {
                    toggleGeneratedFavorite(currentGeneratedRecipeId);
                  }
                }}
                isFavorite={currentGeneratedRecipe?.isFavorite ?? false}
              />
            </div>
          </motion.div>
        )}

        {currentView === 'home' && selectedRecipe && !isGenerating && !generatedRecipeMarkdown && (
          <motion.div
            key="recipe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <Button
              variant="ghost"
              onClick={handleBackToSearch}
              className="mb-6"
            >
              ← Back to Search
            </Button>
            <div className="max-w-4xl mx-auto">
              <RecipeCard
                recipe={selectedRecipe}
                onFavorite={(id) => {
                  if (!user) {
                    setIsLoginModalOpen(true);
                    return;
                  }
                  toggleFavorite(id);
                }}
              />
            </div>
          </motion.div>
        )}

        {(currentView === 'history' || currentView === 'favorites') && !user && (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] max-w-md mx-auto px-4"
          >
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-6">
                {currentView === 'favorites' 
                  ? 'Please login to save and view your favorite recipes.'
                  : 'Please login to save and view your recipe history.'}
              </p>
              <Button variant="hero" onClick={() => setIsLoginModalOpen(true)} className="w-full">
                Login to Continue
              </Button>
            </div>
          </motion.div>
        )}

        {(currentView === 'history' || currentView === 'favorites') && user && (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-display font-bold mb-2">
                  {currentView === 'favorites' ? 'Favorite Recipes' : 'Recipe History'}
                </h1>
                <p className="text-muted-foreground">
                  {currentView === 'favorites'
                    ? 'Your saved recipes for quick access'
                    : 'All recipes you\'ve created'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {filteredGeneratedRecipes.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-display font-semibold mb-2">
                  {currentView === 'favorites' ? 'No favorites yet' : 'No recipes yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {currentView === 'favorites' 
                    ? 'Start creating recipes and save your favorites!'
                    : 'Generate your first recipe to see it here!'}
                </p>
                <Button variant="hero" onClick={() => setCurrentView('home')}>
                  Create a Recipe
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Generated recipes only */}
                {filteredGeneratedRecipes.map((recipe, index) => {
                  const difficulty = recipe.recipeType === 'luxury' ? 4 : 2;
                  return (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={async () => {
                        // Restore images from IndexedDB before displaying
                        const restoredMarkdown = await restoreImagesInMarkdown(recipe.markdown);
                        setGeneratedRecipeMarkdown(restoredMarkdown);
                        setRecipeType(recipe.recipeType);
                        setCurrentGeneratedRecipeId(recipe.id);
                        setSelectedRecipe(null);
                        setCurrentView('home');
                      }}
                    >
                      {/* Recipe Image */}
                      <div className="relative h-40 overflow-hidden bg-secondary/30">
                        {recipe.image ? (
                          <img 
                            src={recipe.image} 
                            alt={recipe.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🍽️
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGeneratedFavorite(recipe.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                        </button>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${recipe.recipeType === 'budget' ? 'bg-budget-light text-budget' : 'bg-luxury-light text-luxury'}`}>
                            {recipe.recipeType === 'budget' ? '💰' : '✨'}
                          </span>
                          {/* Chef caps for difficulty */}
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <ChefHat key={i} className={`w-3 h-3 ${i < difficulty ? 'text-primary' : 'text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2">{recipe.name}</h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {recipe.totalTime || 45} min
                          </span>
                          <span className={`font-medium ${recipe.recipeType === 'budget' ? 'text-budget' : 'text-luxury'}`}>
                            $ {recipe.totalCost?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
