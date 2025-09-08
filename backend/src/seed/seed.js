import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../config/db.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

async function run() {
  await connectDB(process.env.MONGO_URI);

  // Create admin if none
  const adminEmail = "admin@snapclone.com";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Admin",
      email: adminEmail,
      password: "Admin@123",
      role: "admin"
    });
    console.log("✅ Admin created:", adminEmail, "password: Admin@123");
  }

  // Products
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      {
        title: "Aadi Black Casual Shoes",
        price: 408, mrp: 999, discountPercent: 59, rating: 4.2,
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
        category: "Men's Fashion",
      },
      {
        title: "PU Tan Casual Wallet",
        price: 150, mrp: 1299, discountPercent: 88, rating: 4.0,
        image: "https://images.unsplash.com/photo-1523359346063-d879354c0ea5?q=80&w=800&auto=format&fit=crop",
        category: "Men's Fashion",
      },
      {
        title: "Kitchen Clever Cutter",
        price: 132, mrp: 499, discountPercent: 74, rating: 4.1,
        image: "https://images.unsplash.com/photo-1565704471825-86e7b88b046e?q=80&w=800&auto=format&fit=crop",
        category: "Home & Kitchen",
      },
    ]);
    console.log("✅ Products seeded");
  } else {
    console.log("ℹ️ Products already exist:", count);
  }

  process.exit(0);
}

run();
