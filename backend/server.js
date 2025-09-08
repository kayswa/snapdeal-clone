// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
// add other routes...
import adminRoutes from "./routes/adminRoutes.js";
import logRoutes from "./routes/logRoutes.js";

dotenv.config();

const app = express();

// IMPORTANT: parse JSON + cookies first
app.use(express.json());
app.use(cookieParser());

// IMPORTANT: allow your React app & cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // <-- allow cookies
  })
);

// routes
app.use("/api/auth", authRoutes);
// app.use("/api/products", productRoutes) ... etc

// connect DB (your MONGO_URI is already correct)
// ... (your existing mongoose.connect code)
