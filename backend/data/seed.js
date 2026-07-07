import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import products from "./products.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();
  await Product.deleteMany();
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
