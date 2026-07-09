import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import products from "./products.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();
  await Product.deleteMany();
  await Coupon.deleteMany();

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

  const coupons = [
    {
      code: "WELCOME10",
      discountType: "percentage",
      discountAmount: 10,
      expirationDate: new Date("2030-12-31T23:59:59Z"),
      isActive: true,
      minOrderAmount: 0,
    },
    {
      code: "SAVE20",
      discountType: "percentage",
      discountAmount: 20,
      expirationDate: new Date("2030-12-31T23:59:59Z"),
      isActive: true,
      minOrderAmount: 1000,
    },
    {
      code: "FLAT500",
      discountType: "fixed",
      discountAmount: 500,
      expirationDate: new Date("2030-12-31T23:59:59Z"),
      isActive: true,
      minOrderAmount: 2000,
    },
  ];

  await Coupon.insertMany(coupons);
  console.log(`Seeded ${coupons.length} coupons.`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
