import { Router } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// In-memory user store (replace with database in production)
const users: Map<string, { id: string; name: string; email: string; password: string }> = new Map();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Signup
router.post("/signup", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (users.has(email)) {
        return res.status(400).json({ error: "User already exists" });
    }

    const user = {
        id: uuidv4(),
        name,
        email,
        password, // In production, hash this!
    };

    users.set(email, user);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
    });

    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
    });
});

// Login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const user = users.get(email);

    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
    });

    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
    });
});

// Verify token
router.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        const user = users.get(decoded.email);

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
});

export { router as authRouter };
