import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  DollarSign,
  Heart,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  Check,
  Minus,
  Plus,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recipe, Ingredient } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  onFavorite?: (id: string) => void;
}

export function RecipeCard({ recipe, onFavorite }: RecipeCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [servings, setServings] = useState(recipe.servings);

  const servingMultiplier = servings / recipe.servings;

  const toggleIngredient = (name: string) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const formatQuantity = (quantity: string, multiplier: number) => {
    const num = parseFloat(quantity);
    if (isNaN(num)) return quantity;
    const scaled = num * multiplier;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  };

  const Section = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between py-4 px-6 hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-lg font-display font-semibold">{title}</h3>
        {expandedSection === id ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      <motion.div
        initial={false}
        animate={{
          height: expandedSection === id ? "auto" : 0,
          opacity: expandedSection === id ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6">{children}</div>
      </motion.div>
    </div>
  );

  const DifficultyIndicator = ({ level }: { level: number }) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <ChefHat
          key={i}
          className={`w-4 h-4 ${i < level ? 'text-primary' : 'text-muted'}`}
        />
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="relative">
        {recipe.image && (
          <div className="h-64 overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`${recipe.image ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent pt-16' : ''} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    recipe.type === 'budget'
                      ? 'bg-budget-light text-budget'
                      : 'bg-luxury-light text-luxury'
                  }`}
                >
                  {recipe.type === 'budget' ? '💰 Budget' : '✨ Luxury'}
                </span>
                <DifficultyIndicator level={recipe.difficulty} />
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">
                {recipe.name}
              </h1>
              <p className="text-muted-foreground">{recipe.description}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="glass"
                size="icon"
                onClick={() => onFavorite?.(recipe.id)}
                className="rounded-full"
              >
                <Heart
                  className={`w-5 h-5 ${recipe.isFavorite ? 'fill-destructive text-destructive' : ''}`}
                />
              </Button>
              <Button variant="glass" size="icon" className="rounded-full">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="icon" className="rounded-full">
                <Printer className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 p-6 bg-secondary/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Prep</span>
          </div>
          <p className="font-semibold">{recipe.prepTime} min</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Cook</span>
          </div>
          <p className="font-semibold">{recipe.cookTime} min</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Servings</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <p className="font-semibold w-6 text-center">{servings}</p>
            <button
              onClick={() => setServings(servings + 1)}
              className="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Total Cost</span>
          </div>
          <p className={`font-semibold ${recipe.type === 'budget' ? 'text-budget' : 'text-luxury'}`}>
            ${(recipe.totalCost * servingMultiplier).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 px-6 py-4">
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Expandable sections */}
      <Section id="ingredients" title={`Ingredients (${recipe.ingredients.length})`}>
        <div className="space-y-2">
          {recipe.ingredients.map((ingredient) => (
            <button
              key={ingredient.name}
              onClick={() => toggleIngredient(ingredient.name)}
              className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all ${
                checkedIngredients.has(ingredient.name) ? 'bg-muted/30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    checkedIngredients.has(ingredient.name)
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {checkedIngredients.has(ingredient.name) && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <span
                  className={`${
                    checkedIngredients.has(ingredient.name)
                      ? 'line-through text-muted-foreground'
                      : ''
                  }`}
                >
                  {formatQuantity(ingredient.quantity, servingMultiplier)} {ingredient.unit}{" "}
                  <span className="font-medium">{ingredient.name}</span>
                </span>
              </div>
              <span className="text-muted-foreground">
                ${(ingredient.price * servingMultiplier).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section id="instructions" title={`Instructions (${recipe.steps.length} steps)`}>
        <div className="space-y-6">
          {recipe.steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-warm text-primary-foreground flex items-center justify-center font-semibold text-sm">
                {step.number}
              </div>
              <div className="flex-1">
                <p className="text-foreground leading-relaxed">{step.instruction}</p>
                {step.time && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {step.time} min
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="equipment" title="Equipment">
        <div className="flex flex-wrap gap-2">
          {recipe.equipment.map((item) => (
            <span
              key={item}
              className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </Section>

      <Section id="tips" title="Tips & Notes">
        <ul className="space-y-3">
          {recipe.tips.map((tip, index) => (
            <li key={index} className="flex gap-3">
              <span className="text-primary">💡</span>
              <span className="text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </Section>

      {recipe.nutritionFacts && (
        <Section id="nutrition" title="Nutrition Facts (per serving)">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-secondary">
              <p className="text-2xl font-bold text-foreground">{recipe.nutritionFacts.calories}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary">
              <p className="text-2xl font-bold text-foreground">{recipe.nutritionFacts.protein}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary">
              <p className="text-2xl font-bold text-foreground">{recipe.nutritionFacts.carbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary">
              <p className="text-2xl font-bold text-foreground">{recipe.nutritionFacts.fat}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>
        </Section>
      )}
    </motion.div>
  );
}
