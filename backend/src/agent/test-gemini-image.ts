/**
 * Test file for Gemini 2.5 Flash Image generation with aspect ratio
 * Run with: npx tsx src/agent/test-gemini-image.ts
 */

import { execSync } from "child_process";
import "dotenv/config";
import fs from "fs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function testGeminiImageGeneration() {
    console.log("Testing Gemini 2.5 Flash Image Generation with 16:9 aspect ratio...\n");

    if (!GEMINI_API_KEY) {
        console.error("ERROR: GEMINI_API_KEY not found in environment");
        return;
    }

    console.log("API Key found:", GEMINI_API_KEY.slice(0, 10) + "...");

    const prompt = "Professional food photography of spaghetti carbonara, beautifully plated, restaurant quality, warm lighting";

    console.log("Prompt:", prompt);
    console.log("Model: gemini-2.5-flash-image");
    console.log("Aspect Ratio: 16:9\n");

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
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
            console.error("API Error:", response.status, errorText);
            return;
        }

        const result = await response.json();
        const parts = result.candidates?.[0]?.content?.parts || [];

        if (parts.length === 0) {
            console.log("No parts in response. Full response:");
            console.log(JSON.stringify(result, null, 2));
            return;
        }

        for (const part of parts) {
            if (part.text) {
                console.log("Text response:", part.text);
            }
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || "image/png";
                const base64Data = part.inlineData.data;

                console.log("✅ IMAGE GENERATED!");
                console.log("MIME Type:", mimeType);
                console.log("Base64 length:", base64Data.length, "chars");

                // Save image
                const buffer = Buffer.from(base64Data, "base64");
                fs.writeFileSync("test-gemini-output.png", buffer);
                console.log("Saved to: test-gemini-output.png");

                // Get image dimensions using sips (macOS)
                try {
                    const dimensions = execSync("sips -g pixelWidth -g pixelHeight test-gemini-output.png 2>/dev/null").toString();
                    console.log("\nImage dimensions:");
                    console.log(dimensions);
                } catch {
                    console.log("(Could not read dimensions)");
                }

                // Show data URL preview
                console.log("\nData URL format: data:" + mimeType + ";base64,[" + base64Data.length + " chars]");
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testGeminiImageGeneration();
