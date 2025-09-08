import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// ✅ Check if user exists
router.post(
  "/check",
  asyncHandler(async (req, res) => {
    const { identifier } = req.body || {};
    const { type, value } = parseIdentifier(identifier);
    if (!type) return res.status(400).json({ message: "Identifier required" });
    const query = type === "email" ? { email: value } : { phone: value };
    const user = await User.findOne(query);
    return res.json({ exists: !!user });
  })
);

// ✅ Register new user
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body || {};
    if (!name || !password || (!email && !phone)) {
      return res
        .status(400)
        .json({ message: "name, password and email/phone required" });
    }

    const existing = await User.findOne({
      $or: [{ email: email || null }, { phone: phone || null }],
    });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const user = new User({
      name,
      email: email ? email.toLowerCase() : undefined,
      phone: phone ? phone.replace(/\D/g, "") : undefined,
      password,
      verified: false,
    });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`🚨 OTP for ${email || phone}: ${otp}`);

    return res.json({ ok: true, message: "OTP sent" });
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

    if (!user.otp || !user.otpExpires || new Date() > user.otpExpires)
      return res.status(400).json({ message: "OTP expired or not present" });
    if (user.otp !== otp) return res.status(400).json({ message: "OTP invalid" });

    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
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
    return res.json({ ok: true, message: "OTP resent" });
  })
);

// ✅ Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body || {};
    const { type, value } = parseIdentifier(identifier);
    if (!type || !password)
      return res.status(400).json({ message: "Identifier and password required" });

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

      // ✅ FIX: return flag, not 403
      return res.json({
        requireOtp: true,
        message: "Please verify your account via OTP",
      });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  })
);

export default router;
