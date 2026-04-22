const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Redis = require("ioredis");
const mongoose = require("mongoose");

const app = express();
const path = require("path");
app.use(express.static(path.join(__dirname, "../")));

const redis = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));
const ProfileSchema = new mongoose.Schema({
    userId: Number,
    dob: String,
    contact: String,
    address: String
});
const Profile = mongoose.model("Profile", ProfileSchema);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../login.html"));
});

app.get("/test-db", async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT 1");
        res.json({ success: true, rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/register", async (req, res) => {
    res.sendFile(path.join(__dirname, "../register.html"));
});

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const [existing] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const formattedName = name
            .toLowerCase()
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

        await db.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [formattedName, email, hashedPassword]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const [users] = await db.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = users[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        await redis.set(`session:${user.id}`, token, "EX", 3600);

        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const storedToken = await redis.get(`session:${decoded.id}`);

        if (!storedToken || storedToken !== token) {
            return res.status(401).json({ error: "Invalid session" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Unauthorized" });
    }
};

app.get("/api/profile", authenticate, async (req, res) => {
    try {
        const [users] = await db.execute(
            "SELECT id, name, email FROM users WHERE id = ?",
            [req.user.id]
        );

        const profile = await Profile.findOne({ userId: req.user.id });

        res.json({
            ...users[0],
            profile: profile || {}
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/profile", authenticate, async (req, res) => {
    try {
        const { dob, contact, address } = req.body;

        const updated = await Profile.findOneAndUpdate(
            { userId: req.user.id },
            { dob, contact, address },
            { nreturnDocument: "after", upsert: true }
        );

        res.json({ success: true, profile: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});