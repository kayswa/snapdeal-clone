import express from "express";
import { Log } from "../models/log.js";
import { authRequired, adminOnly } from "../middleware/auth.js";


import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", authRequired, adminOnly, asyncHandler(async (req, res) => {
  const logs = await Log.find().populate("user", "name email role").sort({ createdAt: -1 }).limit(200);
  res.json(logs);
}));

export default router;
