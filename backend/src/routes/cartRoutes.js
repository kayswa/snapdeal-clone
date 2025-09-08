// backend/src/routes/cartRoutes.js
import express from "express";
import { authRequired } from "../middleware/auth.js";
import Cart from "../models/Cart.js"; // ✅ make sure you have a Cart model

const router = express.Router();

// Get user cart
router.get("/", authRequired, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate("items.productId");
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add item to cart
router.post("/add", authRequired, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find(
      (i) => i.productId.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Remove item from cart
router.post("/remove", authRequired, async (req, res) => {
  const { productId } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.json({ items: [] });

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
