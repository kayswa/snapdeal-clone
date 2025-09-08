// backend/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, default: undefined },
  phone: { type: String, unique: true, sparse: true, default: undefined },
  password: { type: String, required: true },
  dob: { type: Date },
  keepLoggedIn: { type: Boolean },
  verified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
});


// password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
