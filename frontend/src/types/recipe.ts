export type RecipeType = 'budget' | 'luxury';

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  price: number;
  checked?: boolean;
}

export interface Step {
  number: number;
  instruction: string;
  time?: number;
}

export interface Recipe {
  id: string;
  name: string;
  type: RecipeType;
  description: string;
  image?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  totalCost: number;
  ingredients: Ingredient[];
  steps: Step[];
  equipment: string[];
  tips: string[];
  nutritionFacts?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  createdAt: Date;
  isFavorite?: boolean;
}

export interface GenerationStatus {
  stage: 'idle' | 'searching' | 'pricing' | 'generating' | 'complete' | 'error';
  message: string;
  progress: number;
}
