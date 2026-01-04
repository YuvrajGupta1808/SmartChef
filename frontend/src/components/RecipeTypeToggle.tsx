import { motion } from "framer-motion";
import { Wallet, Sparkles } from "lucide-react";
import type { RecipeType } from "@/types/recipe";

interface RecipeTypeToggleProps {
  value: RecipeType;
  onChange: (value: RecipeType) => void;
}

export function RecipeTypeToggle({ value, onChange }: RecipeTypeToggleProps) {
  return (
    <div className="relative flex items-center bg-secondary rounded-xl p-1 w-fit">
      <motion.div
        className={`absolute top-1 bottom-1 rounded-lg ${
          value === 'budget' ? 'gradient-budget' : 'gradient-luxury'
        }`}
        initial={false}
        animate={{
          left: value === 'budget' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)',
        }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
      
      <button
        onClick={() => onChange('budget')}
        className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
          value === 'budget' ? 'text-budget-foreground' : 'text-muted-foreground'
        }`}
      >
        <Wallet className="w-4 h-4" />
        <span>Budget</span>
        <span className="text-lg">💰</span>
      </button>
      
      <button
        onClick={() => onChange('luxury')}
        className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
          value === 'luxury' ? 'text-luxury-foreground' : 'text-muted-foreground'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>Luxury</span>
        <span className="text-lg">✨</span>
      </button>
    </div>
  );
}
