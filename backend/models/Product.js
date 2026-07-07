import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Shirts", "Polos", "T-Shirts", "Trousers", "Jeans", "Jackets", "Sweatshirts", "Shorts"],
    },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    tag: { type: String, enum: ["New", "Sale", ""], default: "" },
    colors: [{ type: String }],
    sizes: [{ type: String, default: ["S", "M", "L", "XL"] }],
    image: { type: String, required: true },
    description: { type: String, required: true },
    stock: { type: Number, default: 20 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
