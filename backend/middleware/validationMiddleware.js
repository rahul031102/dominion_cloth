import { z } from "zod";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            field: e.path.slice(1).join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Common Schemas
export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().optional(),
  }),
});

export const addressSchema = z.object({
  body: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(4, "Postal code is required"),
    country: z.string().min(2).optional(),
    phone: z.string().min(10, "Phone number is required"),
    isDefault: z.boolean().optional(),
  }),
});

export const productAdminSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Product name is required"),
    brand: z.string().min(1, "Brand is required"),
    category: z.enum(["Shirts", "Polos", "T-Shirts", "Trousers", "Jeans", "Jackets", "Sweatshirts", "Shorts"], {
      errorMap: () => ({ message: "Invalid category selection" })
    }),
    price: z.number().positive("Price must be a positive number"),
    mrp: z.number().positive("MRP must be a positive number"),
    stock: z.number().int().nonnegative("Stock count cannot be negative"),
    tag: z.enum(["New", "Sale", ""]).optional(),
    image: z.string().url("Main product image must be a valid URL"),
    images: z.array(z.string().url("Gallery image must be a valid URL")).optional(),
    sizes: z.array(z.string().min(1)).min(1, "At least one size is required"),
    colors: z.array(z.string().min(1)).min(1, "At least one color is required"),
    description: z.string().min(1, "Description is required"),
    variants: z
      .array(
        z.object({
          size: z.string().min(1, "Size is required"),
          color: z.string().min(1, "Color is required"),
          stock: z.number().int().nonnegative("Stock count cannot be negative"),
        })
      )
      .optional(),
  }),
});
