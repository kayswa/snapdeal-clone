import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
dotenv.config();

const app = express();

// CORS so frontend can call with cookies (credentials)
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("API running"));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/cart", cartRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌", err);
  res.status(500).json({ message: err.message || "Server error" });
});

const port = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`🚀 Server http://localhost:${port}`)))
  .catch((e) => {
    console.error("DB connection failed", e);
    process.exit(1);
  });
