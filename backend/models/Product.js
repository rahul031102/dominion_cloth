import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

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
    sizes: [{ type: String }],
    image: { type: String, required: true },
    images: [{ type: String }], // Array for multiple image galleries
    description: { type: String, required: true },
    variants: [
      {
        size: { type: String, required: true },
        color: { type: String, required: true },
        stock: { type: Number, required: true, default: 0 },
      },
    ],
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Add text index for search capabilities
productSchema.index({ name: "text", brand: "text", description: "text" });

export default mongoose.model("Product", productSchema);
