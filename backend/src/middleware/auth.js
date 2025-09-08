// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// 🔐 Require authentication
export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token =
    req.cookies?.token ||
    (authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;   // ✅ consistent: always attach userId
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid/expired" });
  }
}

// 🔐 Admin check
export function adminOnly(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

// 🔐 Attach user to request (without password)
export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  req.user = await User.findById(req.userId).select("-password");
  next();
}

// ✅ Helper to sign JWT
export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}
