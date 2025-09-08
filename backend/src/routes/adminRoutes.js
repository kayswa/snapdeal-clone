import express from "express";
import { User } from "../models/User.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/users", authRequired, adminOnly, asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
}));

router.patch("/users/:id/role", authRequired, adminOnly, asyncHandler(async (req, res) => {
  const { role } = req.body; // "admin" or "user"
  const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  res.json(u);
}));

export default router;
