import express from "express";
import { Product } from "../models/Product.js";
import { Log } from "../models/log.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authRequired, adminOnly } from "../middleware/auth.js";


const router = express.Router();

// Public: list products (with optional q/category filters)
router.get("/", asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: q, $options: "i" };
  if (category) filter.category = category;
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
}));

// Admin: create
router.post("/", authRequired, adminOnly, asyncHandler(async (req, res) => {
  const p = await Product.create(req.body);
  await Log.create({ type: "CREATE_PRODUCT", user: req.userId, meta: { productId: p._id }, ip: req.ip, userAgent: req.headers["user-agent"] });
  res.status(201).json(p);
}));

// Admin: update
router.put("/:id", authRequired, adminOnly, asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await Log.create({ type: "UPDATE_PRODUCT", user: req.userId, meta: { productId: p?._id }, ip: req.ip, userAgent: req.headers["user-agent"] });
  res.json(p);
}));

// Admin: delete
router.delete("/:id", authRequired, adminOnly, asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  await Log.create({ type: "DELETE_PRODUCT", user: req.userId, meta: { productId: req.params.id }, ip: req.ip, userAgent: req.headers["user-agent"] });
  res.json({ ok: true });
}));

export default router;
