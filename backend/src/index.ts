import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { agentRouter } from "./routes/agent.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.WEB_PORT || process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/agent", agentRouter);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
