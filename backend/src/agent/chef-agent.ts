import { Agent } from "@strands-agents/sdk";
import { OpenAIModel } from "@strands-agents/sdk/openai";
import dotenv from "dotenv";
import { appendImagesToRecipe } from "./gemini-image-gen.js";
import { openAgentsClient } from "./openagents-client.js";

dotenv.config();

const SYSTEM_PROMPT = `You are SmartChef, an AI-powered culinary assistant.

Your capabilities:
- Answer cooking-related questions
- Provide cooking tips and techniques  
- Discuss ingredients, nutrition, and dietary restrictions
- Help with meal planning
- Answer general questions on any topic

When a user wants a specific recipe (like "butter chicken", "pasta carbonara", etc.), respond with EXACTLY this format:
[RECIPE: dish_name]

If user mentions "luxury" or "premium" or "fancy" or "expensive", use:
[RECIPE_LUXURY: dish_name]

If user mentions a specific location/city, include it:
[RECIPE: dish_name | location]
[RECIPE_LUXURY: dish_name | location]

Examples:
- User: "make me butter chicken" → [RECIPE: butter chicken]
- User: "luxury pasta carbonara" → [RECIPE_LUXURY: pasta carbonara]
- User: "butter chicken for Texas" → [RECIPE: butter chicken | Texas]
- User: "expensive sushi" → [RECIPE_LUXURY: sushi]

For general questions, cooking tips, or suggestions - just answer normally without the tag.

Be friendly and enthusiastic about cooking!`;

const model = new OpenAIModel({
    apiKey: process.env.OPENAI_API_KEY || "",
    modelId: "gpt-4o-mini",
    maxTokens: 2000,
    temperature: 0.7,
});

const strandsAgent = new Agent({
    model,
    systemPrompt: SYSTEM_PROMPT,
});

interface StreamChunk {
    type: "status" | "text" | "done";
    content: string;
}

interface RecipeRequest {
    dish: string;
    recipeType: "budget" | "luxury";
    location: string;
}

class ChefAgent {
    private parseRecipeRequest(text: string): RecipeRequest | null {
        const luxuryMatch = text.match(/\[RECIPE_LUXURY:\s*(.+?)(?:\s*\|\s*(.+?))?\s*\]/i);
        if (luxuryMatch) {
            return {
                dish: luxuryMatch[1].trim(),
                recipeType: "luxury",
                location: luxuryMatch[2]?.trim() || "San Francisco",
            };
        }

        const budgetMatch = text.match(/\[RECIPE:\s*(.+?)(?:\s*\|\s*(.+?))?\s*\]/i);
        if (budgetMatch) {
            return {
                dish: budgetMatch[1].trim(),
                recipeType: "budget",
                location: budgetMatch[2]?.trim() || "San Francisco",
            };
        }

        return null;
    }

    private cleanRecipeOutput(text: string): string {
        return text
            .replace(/^\[##\s*/g, "## ")
            .replace(/^\[#\s*/g, "# ")
            .replace(/^\[\s*/g, "")
            .trim();
    }

    async chat(message: string, history: any[], _sessionId?: string): Promise<string> {
        try {
            const contextMessages = history
                .slice(-10)
                .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
                .join("\n");

            const fullPrompt = contextMessages
                ? `Previous conversation:\n${contextMessages}\n\nUser: ${message}`
                : message;

            const response = await strandsAgent.invoke(fullPrompt);
            const responseText = response.toString();

            const recipeRequest = this.parseRecipeRequest(responseText);
            if (recipeRequest) {
                const recipe = await this.generateRecipe(recipeRequest);
                return this.cleanRecipeOutput(recipe);
            }

            return responseText || "I apologize, I couldn't generate a response.";
        } catch (error) {
            console.error("Strands Agent error:", error);
            return "I'm having trouble processing that. Could you try rephrasing?";
        }
    }

    private async generateRecipe(request: RecipeRequest): Promise<string> {
        try {
            const isHealthy = await openAgentsClient.checkHealth();
            if (!isHealthy) {
                return "I'm sorry, the recipe service is currently unavailable.";
            }

            const projectId = await openAgentsClient.createRecipeProject(
                request.dish,
                request.recipeType,
                request.location
            );
            const recipe = await openAgentsClient.getProjectResult(projectId);

            // Generate and append AI images to the recipe
            const recipeWithImages = await appendImagesToRecipe(recipe);
            return recipeWithImages;
        } catch (error) {
            console.error("OpenAgents error:", error);
            return "I encountered an error generating your recipe. Please try again.";
        }
    }

    async *streamChat(message: string, history: any[], _sessionId?: string, includeImages: boolean = false): AsyncGenerator<StreamChunk, void, unknown> {
        try {
            const contextMessages = history
                .slice(-10)
                .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
                .join("\n");

            const fullPrompt = contextMessages
                ? `Previous conversation:\n${contextMessages}\n\nUser: ${message}`
                : message;

            // Show thinking status while collecting response
            yield { type: "status", content: "Thinking..." };

            // IMPORTANT: Collect FULL response first before sending anything
            let fullResponse = "";
            for await (const event of strandsAgent.stream(fullPrompt)) {
                if (event.type === "modelContentBlockDeltaEvent" && event.delta.type === "textDelta") {
                    fullResponse += event.delta.text;
                }
            }

            // Now check if it's a recipe request
            const recipeRequest = this.parseRecipeRequest(fullResponse);

            if (recipeRequest) {
                // It's a recipe request - call OpenAgents
                yield { type: "status", content: `🍳 Creating ${recipeRequest.recipeType} recipe for ${recipeRequest.dish}...` };
                yield { type: "status", content: "🔍 Searching for ingredient prices..." };

                try {
                    const isHealthy = await openAgentsClient.checkHealth();
                    if (!isHealthy) {
                        yield { type: "text", content: "Recipe service unavailable." };
                        yield { type: "done", content: "" };
                        return;
                    }

                    const projectId = await openAgentsClient.createRecipeProject(
                        recipeRequest.dish,
                        recipeRequest.recipeType,
                        recipeRequest.location
                    );

                    yield { type: "status", content: `👨‍🍳 ${recipeRequest.recipeType === "luxury" ? "Crafting premium recipe..." : "Creating budget-friendly recipe..."}` };

                    const result = await openAgentsClient.getProjectResult(projectId);

                    let finalRecipe = result;

                    // Only generate images if requested (home page requests)
                    if (includeImages) {
                        yield { type: "status", content: "📸 Generating AI images..." };
                        finalRecipe = await appendImagesToRecipe(result);
                    }

                    // Clean and send the recipe
                    yield { type: "text", content: this.cleanRecipeOutput(finalRecipe) };
                } catch (error) {
                    console.error("OpenAgents error:", error);
                    yield { type: "text", content: "Error generating recipe. Please try again." };
                }
            } else {
                // Not a recipe request - send the normal Strands response
                yield { type: "text", content: fullResponse };
            }

            yield { type: "done", content: "" };
        } catch (error) {
            console.error("Strands streaming error:", error);
            yield { type: "text", content: "I'm having trouble processing that." };
            yield { type: "done", content: "" };
        }
    }
}

export const chefAgent = new ChefAgent();
