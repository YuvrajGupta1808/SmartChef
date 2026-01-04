/**
 * Image generation using Google Gemini API
 */

import "dotenv/config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

async function generateImage(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        console.error("[GeminiImageGen] No API key configured");
        return "";
    }

    try {
        console.log(`[GeminiImageGen] Generating image: ${prompt.slice(0, 80)}...`);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        imageConfig: { aspectRatio: "16:9" },
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[GeminiImageGen] API error:", response.status, errorText);
            return "";
        }

        const result = await response.json();
        const parts = result.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData?.data) {
                // Return as base64 data URL
                const mimeType = part.inlineData.mimeType || "image/png";
                const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                console.log("[GeminiImageGen] ✅ Image generated successfully");
                return dataUrl;
            }
        }

        console.error("[GeminiImageGen] No image in response");
        return "";
    } catch (error) {
        console.error("[GeminiImageGen] Error:", error);
        return "";
    }
}

export async function generateDishImage(dishName: string): Promise<string> {
    const prompt = `Professional food photography of ${dishName}, beautifully plated on an elegant dish, restaurant quality presentation, garnished perfectly, warm lighting, appetizing, no text or watermarks`;
    return generateImage(prompt);
}

export async function generateIngredientsImage(dishName: string, ingredients: string[]): Promise<string> {
    const ingredientList = ingredients.slice(0, 8).join(", ");
    const prompt = `Professional flat-lay food photography of fresh ingredients for ${dishName}: ${ingredientList}, neatly arranged on wooden cutting board, bright clean lighting, appetizing, no text or watermarks`;
    return generateImage(prompt);
}

export function parseIngredientsFromRecipe(recipe: string): string[] {
    const ingredients: string[] = [];
    const tableRowRegex = /\|\s*([^|$]+?)\s*\|\s*\$[\d.]+\s*\|/g;
    let match;
    while ((match = tableRowRegex.exec(recipe)) !== null) {
        const ingredient = match[1].trim();
        if (ingredient && !ingredient.includes("---") && ingredient.toLowerCase() !== "item") {
            const cleanIngredient = ingredient
                .replace(/^\d+[\d\/\s]*(lb|oz|cup|tbsp|tsp|g|kg|ml|l|bunch|clove|can|pkg)s?\s*/i, "")
                .trim();
            if (cleanIngredient) ingredients.push(cleanIngredient);
        }
    }
    return ingredients;
}

export function parseDishNameFromRecipe(recipe: string): string {
    const headerMatch = recipe.match(/##\s*(.+?)\s*[-–]\s*(Budget|Luxury)/i);
    if (headerMatch) return headerMatch[1].trim();
    const fallbackMatch = recipe.match(/##\s*(.+)/);
    return fallbackMatch ? fallbackMatch[1].trim() : "dish";
}

export async function appendImagesToRecipe(recipe: string): Promise<string> {
    const dishName = parseDishNameFromRecipe(recipe);
    const ingredients = parseIngredientsFromRecipe(recipe);

    console.log(`[GeminiImageGen] Generating images for: ${dishName}`);

    const [dishImage, ingredientsImage] = await Promise.all([
        generateDishImage(dishName),
        generateIngredientsImage(dishName, ingredients),
    ]);

    if (!dishImage && !ingredientsImage) {
        console.log("[GeminiImageGen] No images generated");
        return recipe;
    }

    let imageSection = "\n\n## Recipe Images\n\n";
    if (ingredientsImage) imageSection += `### Ingredients\n![Ingredients for ${dishName}](${ingredientsImage})\n\n`;
    if (dishImage) imageSection += `### Final Dish\n![${dishName}](${dishImage})\n\n`;
    imageSection += "*AI-generated images using Google Gemini*\n";

    const insertPoint = recipe.indexOf("### Ingredients");
    return insertPoint > 0
        ? recipe.slice(0, insertPoint) + imageSection + recipe.slice(insertPoint)
        : recipe + imageSection;
}
