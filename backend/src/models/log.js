import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["SIGNUP", "SIGNUP_START", "SIGNUP_VERIFIED", "LOGIN", "LOGOUT"],
      required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ip: String,
    userAgent: String,
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export const Log = mongoose.models.Log || mongoose.model("Log", logSchema);
