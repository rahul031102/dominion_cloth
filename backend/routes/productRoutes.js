import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, admin } from "../config/authMiddleware.js";
import { validateRequest, productAdminSchema } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin protected endpoints
router.post("/", protect, admin, validateRequest(productAdminSchema), createProduct);
router.put("/:id", protect, admin, validateRequest(productAdminSchema), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

export default router;
