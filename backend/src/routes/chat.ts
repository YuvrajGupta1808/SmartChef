import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { chefAgent } from "../agent/chef-agent.js";

const router = Router();

// In-memory chat history (replace with database in production)
const chatSessions: Map<string, { id: string; messages: any[] }> = new Map();

// Create new chat session
router.post("/session", (req, res) => {
    const sessionId = uuidv4();
    chatSessions.set(sessionId, {
        id: sessionId,
        messages: [],
    });
    res.json({ sessionId });
});

// Send message to chat (non-streaming)
router.post("/message", async (req, res) => {
    const { sessionId, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Create session if not exists
    let session = chatSessions.get(sessionId);
    if (!session) {
        session = { id: sessionId || uuidv4(), messages: [] };
        chatSessions.set(session.id, session);
    }

    // Add user message
    session.messages.push({
        id: uuidv4(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
    });

    try {
        // Get response from agent (pass sessionId for state tracking)
        const response = await chefAgent.chat(message, session.messages, session.id);

        // Add assistant message
        const assistantMessage = {
            id: uuidv4(),
            role: "assistant",
            content: response,
            timestamp: new Date().toISOString(),
        };
        session.messages.push(assistantMessage);

        res.json({
            sessionId: session.id,
            message: assistantMessage,
        });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to get response from agent" });
    }
});

// Get chat history
router.get("/history/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = chatSessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }

    res.json({ messages: session.messages });
});

// Stream message (SSE)
router.post("/stream", async (req, res) => {
    const { sessionId, message, includeImages = false } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let session = chatSessions.get(sessionId);
    if (!session) {
        session = { id: sessionId || uuidv4(), messages: [] };
        chatSessions.set(session.id, session);
    }

    session.messages.push({
        id: uuidv4(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
    });

    try {
        let fullResponse = "";

        // Stream response from agent (pass sessionId for state tracking, includeImages for image generation)
        for await (const chunk of chefAgent.streamChat(message, session.messages, session.id, includeImages)) {
            if (chunk.type === "status") {
                // Send status updates
                res.write(`data: ${JSON.stringify({ type: "status", content: chunk.content })}\n\n`);
            } else if (chunk.type === "text") {
                // Send text chunks
                fullResponse += chunk.content;
                res.write(`data: ${JSON.stringify({ type: "text", content: chunk.content })}\n\n`);
            } else if (chunk.type === "done") {
                // Add complete message to history
                session.messages.push({
                    id: uuidv4(),
                    role: "assistant",
                    content: fullResponse,
                    timestamp: new Date().toISOString(),
                });

                res.write(`data: ${JSON.stringify({ type: "done", sessionId: session.id })}\n\n`);
            }
        }

        res.end();
    } catch (error) {
        console.error("Stream error:", error);
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to stream response" })}\n\n`);
        res.end();
    }
});

export { router as chatRouter };
