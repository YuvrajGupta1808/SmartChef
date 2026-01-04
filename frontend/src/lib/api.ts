const API_BASE = "http://localhost:3001/api";

// Auth API
export const authApi = {
    async login(email: string, password: string) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Login failed");
        }
        return res.json();
    },

    async signup(name: string, email: string, password: string) {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Signup failed");
        }
        return res.json();
    },

    async getMe(token: string) {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
    },
};

// Chat API
export const chatApi = {
    async sendMessage(message: string, sessionId?: string) {
        const res = await fetch(`${API_BASE}/chat/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, sessionId }),
        });
        if (!res.ok) throw new Error("Failed to send message");
        return res.json();
    },

    async streamMessage(
        message: string,
        sessionId: string | undefined,
        onStatus: (status: string) => void,
        onText: (text: string) => void,
        onDone: (sessionId: string) => void,
        onError: (error: string) => void,
        includeImages: boolean = false
    ) {
        try {
            const res = await fetch(`${API_BASE}/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, sessionId, includeImages }),
            });

            if (!res.ok) throw new Error("Failed to stream message");

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No reader available");

            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete lines from buffer
                const lines = buffer.split("\n");
                // Keep the last incomplete line in buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const jsonStr = line.slice(6);
                            if (jsonStr.trim()) {
                                const data = JSON.parse(jsonStr);
                                if (data.type === "status") {
                                    onStatus(data.content);
                                } else if (data.type === "text") {
                                    console.log("[API] Received text chunk, length:", data.content?.length);
                                    onText(data.content);
                                } else if (data.type === "done") {
                                    onDone(data.sessionId);
                                } else if (data.type === "error") {
                                    onError(data.error);
                                }
                            }
                        } catch (e) {
                            console.error("[API] JSON parse error:", e, "Line:", line.substring(0, 100));
                        }
                    }
                }
            }

            // Process any remaining buffer
            if (buffer.startsWith("data: ")) {
                try {
                    const data = JSON.parse(buffer.slice(6));
                    if (data.type === "text") onText(data.content);
                    else if (data.type === "done") onDone(data.sessionId);
                } catch {
                    // Ignore incomplete final chunk
                }
            }
        } catch (error) {
            onError(error instanceof Error ? error.message : "Unknown error");
        }
    },

    async getHistory(sessionId: string) {
        const res = await fetch(`${API_BASE}/chat/history/${sessionId}`);
        if (!res.ok) throw new Error("Failed to get history");
        return res.json();
    },
};

// Agent API (for OpenAgents integration)
export const agentApi = {
    async generateRecipe(query: string, recipeType: string, location: string) {
        const res = await fetch(`${API_BASE}/agent/generate-recipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, recipeType, location }),
        });
        if (!res.ok) throw new Error("Failed to generate recipe");
        return res.json();
    },

    async getStatus() {
        const res = await fetch(`${API_BASE}/agent/status`);
        if (!res.ok) throw new Error("Failed to get agent status");
        return res.json();
    },
};
