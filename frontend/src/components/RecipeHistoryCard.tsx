import { motion } from "framer-motion";
import { Clock, DollarSign, Heart, ChefHat } from "lucide-react";
import type { Recipe } from "@/types/recipe";

interface RecipeHistoryCardProps {
  recipe: Recipe;
  onClick: () => void;
  onFavorite: (e: React.MouseEvent) => void;
  delay?: number;
}

export function RecipeHistoryCard({
  recipe,
  onClick,
  onFavorite,
  delay = 0,
}: RecipeHistoryCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="w-full text-left glass-card rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-all group"
    >
      {recipe.image && (
        <div className="h-40 overflow-hidden relative">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          <button
            onClick={onFavorite}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                recipe.isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'
              }`}
            />
          </button>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              recipe.type === 'budget'
                ? 'bg-budget-light text-budget'
                : 'bg-luxury-light text-luxury'
            }`}
          >
            {recipe.type === 'budget' ? '💰' : '✨'}
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: recipe.difficulty }).map((_, i) => (
              <ChefHat key={i} className="w-3 h-3 text-primary" />
            ))}
          </div>
        </div>

        <h3 className="font-display font-semibold text-foreground mb-2 line-clamp-1">
          {recipe.name}
        </h3>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className={`flex items-center gap-1 font-medium ${
            recipe.type === 'budget' ? 'text-budget' : 'text-luxury'
          }`}>
            <DollarSign className="w-3.5 h-3.5" />
            <span>{recipe.totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
