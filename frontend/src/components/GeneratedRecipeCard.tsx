import { Button } from "@/components/ui/button";
import { getImage } from "@/lib/imageStorage";
import type { RecipeType } from "@/types/recipe";
import { motion } from "framer-motion";
import {
  Check,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Heart,
  Minus,
  Plus,
  Printer,
  Share2,
  Timer,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ParsedIngredient {
  name: string;
  quantity: string;
  unit: string;
  price: number;
}

interface ParsedStep {
  number: number;
  title: string;
  description: string;
  time?: number;
}

interface ParsedRecipe {
  name: string;
  type: RecipeType;
  ingredientsImage?: string;
  finalDishImage?: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  totalCost: number;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  equipment: string[];
  tips: string[];
  finishingGarnish: string[];
  tags: string[];
  winePairing?: string;
  difficulty: number;
}

interface GeneratedRecipeCardProps {
  markdown: string;
  recipeType: RecipeType;
  onFavorite?: () => void;
  isFavorite?: boolean;
}


function parseRecipeMarkdown(markdown: string, recipeType: RecipeType): ParsedRecipe {
  // Debug: log the markdown to see what we're parsing
  console.log('[RecipeParser] Parsing markdown:', markdown.substring(0, 500));
  
  // Extract recipe name - handle both # and ## headers
  const nameMatch = markdown.match(/^#{1,2}\s*(.+?)(?:\s*[-–]\s*(?:Budget|Luxury)\s*Version)?$/m);
  const name = nameMatch ? nameMatch[1].trim().replace(/^#\s*/, '') : "Generated Recipe";
  
  // Extract images - look for markdown image syntax
  const imageMatches = [...markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  let ingredientsImage: string | undefined;
  let finalDishImage: string | undefined;
  
  console.log('[RecipeParser] Found images:', imageMatches.length);
  
  for (const match of imageMatches) {
    const alt = match[1].toLowerCase();
    const url = match[2];
    console.log('[RecipeParser] Image:', alt, url.substring(0, 50));
    if (alt.includes('final') || alt.includes('dish') || alt.includes('plated') || alt.includes('finished') || !alt.includes('ingredient')) {
      if (!finalDishImage) finalDishImage = url;
    }
    if (alt.includes('ingredient')) {
      ingredientsImage = url;
    }
  }
  
  // If we found images but couldn't categorize, use first as final dish
  if (!finalDishImage && imageMatches.length > 0) {
    finalDishImage = imageMatches[imageMatches.length - 1]?.[2]; // Last image is usually the final dish
    if (imageMatches.length >= 2) {
      ingredientsImage = imageMatches[0]?.[2]; // First image is ingredients
    }
  }
  
  // Extract times - handle **Prep Time:** format
  const prepMatch = markdown.match(/\*?\*?Prep(?:\s*Time)?\*?\*?[:\s]*(\d+)\s*min/i);
  const cookMatch = markdown.match(/\*?\*?Cook(?:\s*Time)?\*?\*?[:\s]*(\d+)\s*min/i);
  const totalMatch = markdown.match(/\*?\*?Total(?:\s*Time)?\*?\*?[:\s]*(\d+)\s*min/i);
  const servingsMatch = markdown.match(/\*?\*?Servings?\*?\*?[:\s]*(\d+)/i);
  const costMatch = markdown.match(/(?:Estimated\s*)?(?:Total\s*)?Cost[:\s]*\$?([\d.]+)/i);
  
  const prepTime = prepMatch ? parseInt(prepMatch[1]) : 15;
  const cookTime = cookMatch ? parseInt(cookMatch[1]) : 30;
  const totalTime = totalMatch ? parseInt(totalMatch[1]) : prepTime + cookTime;
  
  // Extract wine pairing - handle **Wine Pairing:** format
  const wineMatch = markdown.match(/\*?\*?Wine\s*Pairing\*?\*?[:\s]+(.+?)(?=\n\n|\n###|\n\*\*|$)/is);
  let winePairing = wineMatch ? wineMatch[1].trim() : undefined;
  // Clean up any remaining markdown formatting
  if (winePairing) {
    winePairing = winePairing.replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '').replace(/\n/g, ' ').trim();
  }
  
  console.log('[RecipeParser] Wine pairing:', winePairing);
  
  // Parse ingredients from table
  const ingredients: ParsedIngredient[] = [];
  const ingredientSection = markdown.match(/###?\s*(?:Premium|Budget)?\s*Ingredients[\s\S]*?(?=###|Equipment|Method|Instructions|$)/i);
  
  console.log('[RecipeParser] Ingredient section found:', !!ingredientSection);
  
  if (ingredientSection) {
    const tableRows = ingredientSection[0].match(/\|([^|]+)\|([^|]+)\|/g);
    if (tableRows) {
      for (const row of tableRows) {
        if (row.includes('Item') || row.includes('---') || row.includes('Est.') || row.includes('Price')) continue;
        const cells = row.split('|').filter(c => c.trim());
        if (cells.length >= 2) {
          const itemText = cells[0].trim();
          const priceText = cells[1].trim();
          const priceMatchResult = priceText.match(/\$?([\d.]+)/);
          
          const qtyMatch = itemText.match(/^([\d./½¼¾⅓⅔]+)\s*(\w+)?\s+(.+)/);
          if (qtyMatch) {
            ingredients.push({
              quantity: qtyMatch[1],
              unit: qtyMatch[2] || '',
              name: qtyMatch[3].replace(/\([^)]*\)/g, '').trim(),
              price: priceMatchResult ? parseFloat(priceMatchResult[1]) : 0
            });
          } else if (itemText && !itemText.includes('---')) {
            ingredients.push({ quantity: '1', unit: '', name: itemText, price: priceMatchResult ? parseFloat(priceMatchResult[1]) : 0 });
          }
        }
      }
    }
  }
  
  console.log('[RecipeParser] Ingredients parsed:', ingredients.length);

  // Parse steps/method - handle format: **1. Step Title:** followed by description
  const steps: ParsedStep[] = [];
  const methodSection = markdown.match(/###?\s*Method[\s\S]*?(?=###?\s*Finishing|###?\s*Notes|###?\s*Tips|###?\s*Recipe Images|$)/i);
  
  console.log('[RecipeParser] Method section found:', !!methodSection);
  
  if (methodSection) {
    const methodText = methodSection[0];
    console.log('[RecipeParser] Method text:', methodText.substring(0, 500));
    
    // Format: **1. Marinate the Chicken:** followed by description
    // The title is between "**N. " and ":**" or ":"** 
    const stepRegex = /\*\*(\d+)\.\s*([^*]+?)\*\*:?\s*([\s\S]*?)(?=\*\*\d+\.|###|$)/g;
    let stepMatch: RegExpExecArray | null;
    while ((stepMatch = stepRegex.exec(methodText)) !== null) {
      const num = parseInt(stepMatch[1]);
      // Clean up the title - remove trailing colon and asterisks
      let title = stepMatch[2].trim().replace(/:$/, '').replace(/\*+/g, '').trim();
      const description = stepMatch[3].trim()
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log('[RecipeParser] Step found:', num, title, description.substring(0, 80));
      
      if (title) {
        steps.push({
          number: num,
          title: title,
          description: description
        });
      }
    }
    
    // Fallback format 2: 1. **Title:** description (on same line)
    if (steps.length === 0) {
      const altRegex = /(\d+)\.\s*\*\*([^*]+)\*\*:?\s*([^\n]*)/g;
      while ((stepMatch = altRegex.exec(methodText)) !== null) {
        const num = parseInt(stepMatch[1]);
        const title = stepMatch[2].trim().replace(/:$/, '');
        const description = stepMatch[3].trim();
        
        if (title) {
          steps.push({
            number: num,
            title: title,
            description: description
          });
        }
      }
    }
    
    // Fallback format 3: simple numbered list without bold
    if (steps.length === 0) {
      const simpleSteps = [...methodText.matchAll(/(\d+)\.\s+([^\n]+)/g)];
      simpleSteps.forEach((m) => {
        const num = parseInt(m[1]);
        const text = m[2].trim().replace(/\*\*/g, '');
        if (text && !text.includes('|') && !text.includes('---')) {
          const colonIndex = text.indexOf(':');
          if (colonIndex > 0 && colonIndex < 50) {
            steps.push({ 
              number: num, 
              title: text.substring(0, colonIndex).trim(),
              description: text.substring(colonIndex + 1).trim()
            });
          } else {
            steps.push({ number: num, title: text, description: '' });
          }
        }
      });
    }
  }
  
  console.log('[RecipeParser] Total steps parsed:', steps.length);
  
  // Parse equipment - handle both list format and inline format
  const equipment: string[] = [];
  const equipmentSection = markdown.match(/###?\s*Equipment[\s\S]*?(?=###|$)/i);
  if (equipmentSection) {
    const items = equipmentSection[0].match(/[-*]\s+([^\n]+)/g);
    if (items) {
      items.forEach(item => {
        const text = item.replace(/^[-*]\s+/, '').trim();
        if (text) equipment.push(text);
      });
    }
    if (equipment.length === 0) {
      const lines = equipmentSection[0].split('\n').filter(line => 
        line.trim() && !line.startsWith('#') && !line.includes('Equipment')
      );
      lines.forEach(line => {
        const text = line.trim().replace(/^[-*]\s*/, '');
        if (text && text.length > 2) equipment.push(text);
      });
    }
  }
  
  // Parse Finishing & Garnish section
  const finishingGarnish: string[] = [];
  const finishingSection = markdown.match(/###?\s*Finishing\s*(?:&|and)?\s*Garnish[\s\S]*?(?=###|$)/i);
  if (finishingSection) {
    const paragraphs = finishingSection[0].split('\n').filter(line => 
      line.trim() && !line.startsWith('#') && !line.startsWith('-')
    );
    paragraphs.forEach(p => {
      const text = p.trim();
      if (text && text.length > 10) finishingGarnish.push(text);
    });
    
    const items = finishingSection[0].match(/[-*]\s+([^\n]+)/g);
    if (items) {
      items.forEach(item => {
        const text = item.replace(/^[-*]\s+/, '').trim();
        if (text && !finishingGarnish.includes(text)) finishingGarnish.push(text);
      });
    }
  }
  
  // Parse tips/notes
  const tips: string[] = [];
  const notesSection = markdown.match(/###?\s*Notes[\s\S]*?(?=###|Recipe Images|$)/i);
  if (notesSection) {
    const items = notesSection[0].match(/[-*]\s+([^\n]+)/g);
    if (items) {
      items.forEach(item => {
        const text = item.replace(/^[-*]\s+/, '').trim();
        if (text) tips.push(text);
      });
    }
    const paragraphs = notesSection[0].split('\n').filter(line => 
      line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*')
    );
    paragraphs.forEach(p => {
      const text = p.trim();
      if (text && text.length > 20 && !tips.includes(text)) tips.push(text);
    });
  }
  
  // Extract tags
  const tags: string[] = [];
  if (recipeType === 'luxury') tags.push('Luxury');
  if (recipeType === 'budget') tags.push('Budget');
  
  const cuisineMatch = markdown.match(/(?:Italian|Mexican|Asian|Indian|French|American|Mediterranean|Japanese|Chinese|Thai)/gi);
  if (cuisineMatch) {
    cuisineMatch.slice(0, 2).forEach(c => {
      if (!tags.includes(c)) tags.push(c);
    });
  }
  
  return {
    name,
    type: recipeType,
    ingredientsImage,
    finalDishImage,
    prepTime,
    cookTime,
    totalTime,
    servings: servingsMatch ? parseInt(servingsMatch[1]) : 4,
    totalCost: costMatch ? parseFloat(costMatch[1]) : 0,
    ingredients,
    steps,
    equipment,
    tips,
    finishingGarnish,
    tags,
    winePairing,
    difficulty: recipeType === 'luxury' ? 4 : 2
  };
}


export function GeneratedRecipeCard({ markdown, recipeType, onFavorite, isFavorite }: GeneratedRecipeCardProps) {
  const recipe = parseRecipeMarkdown(markdown, recipeType);
  const [expandedSection, setExpandedSection] = useState<string | null>("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [servings, setServings] = useState(recipe.servings);
  const [finalDishImage, setFinalDishImage] = useState<string | undefined>(recipe.finalDishImage);
  const [ingredientsImage, setIngredientsImage] = useState<string | undefined>(recipe.ingredientsImage);

  const servingMultiplier = servings / recipe.servings;

  // Load images from IndexedDB if they use the indexeddb: protocol
  useEffect(() => {
    async function loadImages() {
      if (recipe.finalDishImage?.startsWith('indexeddb:')) {
        const imageId = recipe.finalDishImage.replace('indexeddb:', '');
        const base64 = await getImage(imageId);
        if (base64) setFinalDishImage(base64);
      } else {
        setFinalDishImage(recipe.finalDishImage);
      }

      if (recipe.ingredientsImage?.startsWith('indexeddb:')) {
        const imageId = recipe.ingredientsImage.replace('indexeddb:', '');
        const base64 = await getImage(imageId);
        if (base64) setIngredientsImage(base64);
      } else {
        setIngredientsImage(recipe.ingredientsImage);
      }
    }
    loadImages();
  }, [recipe.finalDishImage, recipe.ingredientsImage]);

  const toggleIngredient = (name: string) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const formatQuantity = (quantity: string, multiplier: number) => {
    const num = parseFloat(quantity);
    if (isNaN(num)) return quantity;
    const scaled = num * multiplier;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between py-4 px-6 hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-lg font-display font-semibold">{title}</h3>
        {expandedSection === id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      <motion.div
        initial={false}
        animate={{ height: expandedSection === id ? "auto" : 0, opacity: expandedSection === id ? 1 : 0 }}
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
        <ChefHat key={i} className={`w-4 h-4 ${i < level ? 'text-primary' : 'text-muted'}`} />
      ))}
    </div>
  );


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden shadow-lg">
      {/* Hero image at top - Final Dish */}
      {finalDishImage && (
        <div className="relative h-72 w-full overflow-hidden">
          <img 
            src={finalDishImage} 
            alt={recipe.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          {/* Overlay header content on the image */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${recipe.type === 'budget' ? 'bg-budget-light/90 text-budget' : 'bg-luxury-light/90 text-luxury'}`}>
                    {recipe.type === 'budget' ? '💰 Budget' : '✨ Luxury'}
                  </span>
                  <DifficultyIndicator level={recipe.difficulty} />
                </div>
                <h1 className="text-3xl font-display font-bold text-foreground drop-shadow-sm">{recipe.name}</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="glass" size="icon" onClick={onFavorite} className="rounded-full backdrop-blur-sm">
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
                <Button variant="glass" size="icon" className="rounded-full backdrop-blur-sm"><Share2 className="w-5 h-5" /></Button>
                <Button variant="glass" size="icon" className="rounded-full backdrop-blur-sm"><Printer className="w-5 h-5" /></Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header info - only show if no image */}
      {!finalDishImage && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${recipe.type === 'budget' ? 'bg-budget-light text-budget' : 'bg-luxury-light text-luxury'}`}>
                  {recipe.type === 'budget' ? '💰 Budget' : '✨ Luxury'}
                </span>
                <DifficultyIndicator level={recipe.difficulty} />
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">{recipe.name}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="glass" size="icon" onClick={onFavorite} className="rounded-full">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
              </Button>
              <Button variant="glass" size="icon" className="rounded-full"><Share2 className="w-5 h-5" /></Button>
              <Button variant="glass" size="icon" className="rounded-full"><Printer className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3 p-6 bg-secondary/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" /><span className="text-xs">Prep</span>
          </div>
          <p className="font-semibold">{recipe.prepTime} min</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" /><span className="text-xs">Cook</span>
          </div>
          <p className="font-semibold">{recipe.cookTime} min</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Timer className="w-4 h-4" /><span className="text-xs">Total</span>
          </div>
          <p className="font-semibold">{recipe.totalTime} min</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="w-4 h-4" /><span className="text-xs">Servings</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setServings(Math.max(1, servings - 1))} className="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <p className="font-semibold w-6 text-center">{servings}</p>
            <button onClick={() => setServings(servings + 1)} className="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" /><span className="text-xs">Cost</span>
          </div>
          <p className={`font-semibold ${recipe.type === 'budget' ? 'text-budget' : 'text-luxury'}`}>
            ${(recipe.totalCost * servingMultiplier).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 py-4">
          {recipe.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">{tag}</span>
          ))}
        </div>
      )}

      {/* Wine pairing */}
      {recipe.winePairing && (
        <div className="px-6 py-3 bg-luxury-light/30 border-y border-luxury/20">
          <p className="text-sm"><span className="font-medium text-luxury">🍷 Wine Pairing:</span> {recipe.winePairing}</p>
        </div>
      )}

      {/* Ingredients section with image */}
      {recipe.ingredients.length > 0 && (
        <Section id="ingredients" title={`${recipe.type === 'budget' ? 'Budget' : 'Premium'} Ingredients (${recipe.ingredients.length})`}>
          {ingredientsImage && (
            <div className="mb-6 bg-secondary/30 rounded-xl overflow-hidden">
              <img src={ingredientsImage} alt="Ingredients" className="w-full h-auto object-contain mx-auto" />
            </div>
          )}
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, idx) => (
              <button
                key={`${ingredient.name}-${idx}`}
                onClick={() => toggleIngredient(ingredient.name)}
                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all ${checkedIngredients.has(ingredient.name) ? 'bg-muted/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checkedIngredients.has(ingredient.name) ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {checkedIngredients.has(ingredient.name) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={`text-left ${checkedIngredients.has(ingredient.name) ? 'line-through text-muted-foreground' : ''}`}>
                    {formatQuantity(ingredient.quantity, servingMultiplier)} {ingredient.unit} <span className="font-medium">{ingredient.name}</span>
                  </span>
                </div>
                {ingredient.price > 0 && <span className="text-muted-foreground">${(ingredient.price * servingMultiplier).toFixed(2)}</span>}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Equipment section */}
      {recipe.equipment.length > 0 && (
        <Section id="equipment" title="Equipment">
          <div className="flex flex-wrap gap-2">
            {recipe.equipment.map((item, idx) => (
              <span key={idx} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-muted-foreground" />
                {item}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Method/Instructions section - with title and description */}
      {recipe.steps.length > 0 && (
        <Section id="instructions" title={`Method (${recipe.steps.length} steps)`}>
          <div className="space-y-6">
            {recipe.steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full gradient-warm text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                  {step.number}
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-semibold text-foreground mb-2">{step.title}</h4>
                  {step.description && (
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  )}
                  {step.time && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />{step.time} min
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Finishing & Garnish section */}
      {recipe.finishingGarnish.length > 0 && (
        <Section id="finishing" title="Finishing & Garnish">
          <ul className="space-y-3">
            {recipe.finishingGarnish.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-primary">🌿</span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Tips & Notes section */}
      {recipe.tips.length > 0 && (
        <Section id="tips" title="Notes">
          <ul className="space-y-3">
            {recipe.tips.map((tip, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-primary">💡</span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </motion.div>
  );
}