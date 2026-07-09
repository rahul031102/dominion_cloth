import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import products from "./products.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();
  await Product.deleteMany();

  const processedProducts = products.map((p) => {
    const variants = [];
    const stockVal = p.stock || 20;
    const itemsCount = p.colors.length * p.sizes.length;
    const stockPerVariant = Math.floor(stockVal / itemsCount) || 5;

    p.colors.forEach((color) => {
      p.sizes.forEach((size) => {
        variants.push({
          size,
          color,
          stock: stockPerVariant,
        });
      });
    });

    return {
      ...p,
      variants,
      images: [
        p.image,
        p.image.replace("q=80&w=800", "q=80&w=800&blur=2") || p.image, // secondary dummy image for gallery
      ],
      rating: Number((4 + Math.random() * 1).toFixed(1)),
      numReviews: Math.floor(Math.random() * 80) + 12,
    };
  });

  await Product.insertMany(processedProducts);
  console.log(`Seeded ${processedProducts.length} products with variants, images, and ratings.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
