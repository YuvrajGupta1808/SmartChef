/**
 * Image generation using Leonardo AI API
 */

const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY || "d030f948-259b-48b5-b99e-b9c39513aee6";
const LEONARDO_URL = "https://cloud.leonardo.ai/api/rest/v2/generations";

// Style IDs from Leonardo AI
const FOOD_PHOTOGRAPHY_STYLE = "7c3f932b-a572-47cb-9b9b-f20211e63b5b"; // Pro Color Photography

interface LeonardoResponse {
    id: string;
    status: string;
    images?: Array<{ url: string }>;
}

async function generateImage(prompt: string): Promise<string> {
    try {
        console.log(`[ImageGen] Starting generation with prompt: ${prompt.slice(0, 100)}...`);

        // Start generation
        const response = await fetch(LEONARDO_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LEONARDO_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gemini-image-2",
                parameters: {
                    width: 1376,
                    height: 768,
                    prompt: prompt,
                    quantity: 1,
                    style_ids: [FOOD_PHOTOGRAPHY_STYLE],
                    prompt_enhance: "OFF",
                },
                public: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[ImageGen] Leonardo API error:", response.status, errorText);
            return "";
        }

        const result = await response.json();
        console.log("[ImageGen] Generation started, response:", JSON.stringify(result).slice(0, 300));

        // Leonardo v2 API returns { generate: { generationId: "..." } }
        const generationId = result.generate?.generationId || result.id || result.generationId;

        if (!generationId) {
            console.error("[ImageGen] No generation ID returned:", result);
            return "";
        }

        console.log(`[ImageGen] Generation ID: ${generationId}`);

        // Poll for completion
        const imageUrl = await pollForImage(generationId);
        return imageUrl;
    } catch (error) {
        console.error("[ImageGen] Image generation error:", error);
        return "";
    }
}

async function pollForImage(generationId: string, maxAttempts = 30): Promise<string> {
    // Leonardo v2 API uses different endpoint for getting generation status
    const pollUrl = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        try {
            const response = await fetch(pollUrl, {
                headers: {
                    "Authorization": `Bearer ${LEONARDO_API_KEY}`,
                },
            });

            if (!response.ok) {
                console.log(`[ImageGen] Poll attempt ${attempt + 1}: HTTP ${response.status}`);
                continue;
            }

            const result = await response.json();
            const generation = result.generations_by_pk || result;
            console.log(`[ImageGen] Poll attempt ${attempt + 1}: status=${generation.status}`);

            // Check for completion
            if (generation.status === "COMPLETE") {
                const images = generation.generated_images || generation.images || [];
                if (images.length > 0) {
                    const imageUrl = images[0].url;
                    console.log(`[ImageGen] Got image URL: ${imageUrl}`);
                    return imageUrl || "";
                }
                console.log(`[ImageGen] Complete but no images found:`, JSON.stringify(generation).slice(0, 500));
                return "";
            }

            if (generation.status === "FAILED") {
                console.error("[ImageGen] Leonardo generation failed");
                return "";
            }
        } catch (error) {
            console.error("[ImageGen] Poll error:", error);
        }
    }

    console.error("[ImageGen] Leonardo generation timed out after", maxAttempts, "attempts");
    return "";
}

export async function generateDishImage(dishName: string): Promise<string> {
    const prompt = `Professional food photography of ${dishName}, beautifully plated on an elegant dish, restaurant quality presentation, garnished perfectly, warm lighting, appetizing, high resolution, no text or watermarks`;
    return generateImage(prompt);
}

export async function generateIngredientsImage(dishName: string, ingredients: string[]): Promise<string> {
    const ingredientList = ingredients.slice(0, 8).join(", ");
    const prompt = `Professional flat-lay food photography of fresh ingredients for ${dishName}: ${ingredientList}, neatly arranged on wooden cutting board, bright clean lighting, appetizing, high resolution, no text or watermarks`;
    return generateImage(prompt);
}

/**
 * Parse ingredients from recipe markdown
 */
export function parseIngredientsFromRecipe(recipe: string): string[] {
    const ingredients: string[] = [];

    // Match table rows like "| 1 lb chicken breast | $5.99 |"
    const tableRowRegex = /\|\s*([^|$]+?)\s*\|\s*\$[\d.]+\s*\|/g;
    let match;
    while ((match = tableRowRegex.exec(recipe)) !== null) {
        const ingredient = match[1].trim();
        // Skip header rows
        if (ingredient && !ingredient.includes("---") && ingredient.toLowerCase() !== "item") {
            // Extract just the ingredient name (remove quantities)
            const cleanIngredient = ingredient
                .replace(/^\d+[\d\/\s]*(lb|oz|cup|tbsp|tsp|g|kg|ml|l|bunch|clove|can|pkg)s?\s*/i, "")
                .trim();
            if (cleanIngredient) {
                ingredients.push(cleanIngredient);
            }
        }
    }

    return ingredients;
}

/**
 * Extract dish name from recipe markdown
 */
export function parseDishNameFromRecipe(recipe: string): string {
    // Match "## Dish Name - Budget/Luxury Version"
    const headerMatch = recipe.match(/##\s*(.+?)\s*[-–]\s*(Budget|Luxury)/i);
    if (headerMatch) {
        return headerMatch[1].trim();
    }

    // Fallback: first ## header
    const fallbackMatch = recipe.match(/##\s*(.+)/);
    if (fallbackMatch) {
        return fallbackMatch[1].trim();
    }

    return "dish";
}

/**
 * Generate images and append to recipe
 */
export async function appendImagesToRecipe(recipe: string): Promise<string> {
    const dishName = parseDishNameFromRecipe(recipe);
    const ingredients = parseIngredientsFromRecipe(recipe);

    console.log(`[ImageGen] Generating Leonardo AI images for: ${dishName}`);
    console.log(`[ImageGen] Parsed ingredients: ${ingredients.join(", ")}`);

    // Generate both images in parallel
    const [dishImage, ingredientsImage] = await Promise.all([
        generateDishImage(dishName),
        generateIngredientsImage(dishName, ingredients),
    ]);

    // Only add image section if we have at least one image
    if (!dishImage && !ingredientsImage) {
        console.log("[ImageGen] No images generated, returning recipe without images");
        return recipe;
    }

    let imageSection = "\n\n## Recipe Images\n\n";

    if (ingredientsImage) {
        imageSection += `### Ingredients\n![Ingredients for ${dishName}](${ingredientsImage})\n\n`;
    }

    if (dishImage) {
        imageSection += `### Final Dish\n![${dishName}](${dishImage})\n\n`;
    }

    imageSection += "*AI-generated images using Leonardo AI*\n";

    // Insert images after the cost line but before ingredients section
    const insertPoint = recipe.indexOf("### Ingredients");
    if (insertPoint > 0) {
        return recipe.slice(0, insertPoint) + imageSection + recipe.slice(insertPoint);
    }

    // Fallback: append at end
    return recipe + imageSection;
}
