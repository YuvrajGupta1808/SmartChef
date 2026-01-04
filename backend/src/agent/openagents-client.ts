const OPENAGENTS_URL = process.env.OPENAGENTS_URL || "http://localhost:8700";

interface MCPResponse<T> {
    jsonrpc: string;
    id: number;
    result?: T;
    error?: { code: number; message: string };
}

interface ProjectInfo {
    id: string;
    status: string;
    messages: Array<{
        content: { text?: string };
        timestamp: string;
    }>;
}

export class OpenAgentsClient {
    private baseUrl: string;
    private requestId = 0;

    constructor(baseUrl: string = OPENAGENTS_URL) {
        this.baseUrl = baseUrl;
    }

    private async mcpCall<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
        const res = await fetch(`${this.baseUrl}/mcp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method,
                params,
                id: ++this.requestId,
            }),
        });

        const data: MCPResponse<T> = await res.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.result as T;
    }

    async checkHealth(): Promise<boolean> {
        try {
            // Try to list templates as a health check
            await this.mcpCall("tools/call", {
                name: "list_project_templates",
                arguments: {},
            });
            return true;
        } catch {
            return false;
        }
    }

    async createRecipeProject(
        dish: string,
        recipeType: "budget" | "luxury",
        _location: string = "San Francisco"
    ): Promise<string> {
        const templateId = recipeType === "luxury" ? "luxury_recipe" : "budget_recipe";

        const result = await this.mcpCall<{ content: Array<{ text: string }> }>("tools/call", {
            name: "start_project",
            arguments: {
                template_id: templateId,
                goal: dish,
                name: `${recipeType} ${dish}`,
            },
        });

        // Parse project ID from response
        const responseText = result.content?.[0]?.text || "";
        const match = responseText.match(/project[_\s]?id[:\s]+["']?([a-zA-Z0-9_-]+)["']?/i)
            || responseText.match(/["']?id["']?\s*:\s*["']([a-zA-Z0-9_-]+)["']/);

        if (match) {
            return match[1];
        }

        // Try to extract from JSON
        try {
            const jsonMatch = responseText.match(/\{[^}]+\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.project_id || parsed.id) {
                    return parsed.project_id || parsed.id;
                }
            }
        } catch {
            // Continue to error
        }

        console.log("Start project response:", responseText);
        throw new Error("Could not extract project ID from response");
    }

    async getProject(projectId: string): Promise<ProjectInfo> {
        const result = await this.mcpCall<{ content: Array<{ text: string }> }>("tools/call", {
            name: "get_project",
            arguments: { project_id: projectId },
        });

        const responseText = result.content?.[0]?.text || "{}";

        try {
            // Extract status using regex (more reliable than JSON parsing)
            const statusMatch = responseText.match(/'status':\s*'(\w+)'/);
            const status = statusMatch ? statusMatch[1] : "unknown";

            // Extract messages array - find all message text content
            const messages: Array<{ content: { text?: string }; timestamp: string }> = [];
            const messageRegex = /'content':\s*\{'text':\s*['"]([\s\S]*?)['"]\s*\}/g;
            let match;
            while ((match = messageRegex.exec(responseText)) !== null) {
                // Unescape the text
                const text = match[1]
                    .replace(/\\n/g, "\n")
                    .replace(/\\t/g, "\t")
                    .replace(/\\'/g, "'")
                    .replace(/\\"/g, '"');
                messages.push({
                    content: { text },
                    timestamp: new Date().toISOString(),
                });
            }

            return {
                id: projectId,
                status,
                messages,
            };
        } catch (e) {
            console.error("Error parsing project response:", e);
        }

        return {
            id: projectId,
            status: "unknown",
            messages: [],
        };
    }

    async getProjectResult(projectId: string, timeoutMs: number = 120000): Promise<string> {
        const startTime = Date.now();
        let lastContent = "";
        let lastMessageCount = 0;

        console.log(`[OpenAgents] Waiting for project ${projectId} to complete...`);

        while (Date.now() - startTime < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            try {
                const project = await this.getProject(projectId);
                console.log(`[OpenAgents] Project status: ${project.status}, messages: ${project.messages?.length || 0}`);

                // Get latest messages
                if (project.messages && project.messages.length > lastMessageCount) {
                    for (let i = lastMessageCount; i < project.messages.length; i++) {
                        const msg = project.messages[i];
                        if (msg.content?.text) {
                            lastContent = msg.content.text;
                            console.log(`[OpenAgents] New message (${i}): ${lastContent.substring(0, 100)}...`);
                        }
                    }
                    lastMessageCount = project.messages.length;
                }

                if (project.status === "completed") {
                    console.log(`[OpenAgents] Project completed! Content length: ${lastContent.length}`);
                    return lastContent || "Recipe completed but no content received.";
                }

                if (project.status === "failed" || project.status === "stopped") {
                    console.log(`[OpenAgents] Project failed/stopped`);
                    throw new Error("Recipe generation failed");
                }
            } catch (error) {
                if (error instanceof Error && error.message === "Recipe generation failed") {
                    throw error;
                }
                console.error("Error checking project status:", error);
            }
        }

        // Return whatever we have if timeout
        console.log(`[OpenAgents] Timeout! Returning last content: ${lastContent.substring(0, 100)}...`);
        if (lastContent) {
            return lastContent;
        }

        throw new Error("Recipe generation timed out");
    }
}

export const openAgentsClient = new OpenAgentsClient();
