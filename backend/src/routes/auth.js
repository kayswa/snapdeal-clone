// backend/src/routes/auth.js
import express from "express";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authRequired, signToken } from "../middleware/auth.js";

const router = express.Router();

function parseIdentifier(identifier = "") {
  const id = String(identifier || "").trim();
  if (!id) return { type: null, value: null };
  if (id.includes("@")) return { type: "email", value: id.toLowerCase() };
  const digits = id.replace(/\D/g, "");
  return { type: "phone", value: digits };
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Step 1: Check if user exists
router.post(
  "/check",
  asyncHandler(async (req, res) => {
    const { identifier } = req.body || {};
    const { type, value } = parseIdentifier(identifier);
    if (!type) return res.status(400).json({ message: "Identifier required" });

    const q = type === "email" ? { email: value } : { phone: value };
    const user = await User.findOne(q);

    res.json({ exists: !!user });
  })
);

// ✅ Register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body || {};
    if (!name || !password || (!email && !phone)) {
      return res
        .status(400)
        .json({ message: "name, password and email/phone required" });
    }

    const conditions = [];
    if (email?.trim()) conditions.push({ email: email.toLowerCase() });
    if (phone?.trim()) conditions.push({ phone: phone.replace(/\D/g, "") });

    const existing = conditions.length
      ? await User.findOne({ $or: conditions })
      : null;

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email: email?.trim() ? email.toLowerCase() : undefined,
      phone: phone?.trim() ? phone.replace(/\D/g, "") : undefined,
      password,
      verified: false,
    });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`🚨 OTP for ${email || phone}: ${otp}`);

    res.json({ ok: true, message: "OTP sent" });
  })
);

// ✅ Verify OTP
router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const { identifier, otp } = req.body || {};
    const { type, value } = parseIdentifier(identifier);
    if (!type) return res.status(400).json({ message: "Identifier required" });

    const q = type === "email" ? { email: value } : { phone: value };
    const user = await User.findOne(q);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "OTP expired or not present" });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "OTP invalid" });
    }

    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  })
);

// ✅ Resend OTP
router.post(
  "/resend-otp",
  asyncHandler(async (req, res) => {
    const { identifier } = req.body || {};
    const { type, value } = parseIdentifier(identifier);
    if (!type) return res.status(400).json({ message: "Identifier required" });

    const q = type === "email" ? { email: value } : { phone: value };
    const user = await User.findOne(q);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`🚨 Resent OTP for ${user.email || user.phone}: ${otp}`);
    res.json({ ok: true, message: "OTP resent" });
  })
);

// ✅ Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body || {};
    const { type, value } = parseIdentifier(identifier);
    if (!type || !password) {
      return res
        .status(400)
        .json({ message: "Identifier and password required" });
    }

    const q = type === "email" ? { email: value } : { phone: value };
    const user = await User.findOne(q);
    if (!user) return res.status(400).json({ message: "User not found" });

    const ok = await user.matchPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.verified) {
      if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
        user.otp = generateOTP();
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
      }
      console.log(`🚨 OTP for ${user.email || user.phone}: ${user.otp}`);

      return res.json({
        requireOtp: true,
        message: "Please verify your account via OTP",
      });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  })
);

// ✅ Get current user (for header)
router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  })
);

export default router;
