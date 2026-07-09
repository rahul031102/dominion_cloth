import Product from "../models/Product.js";

// Fetch filtered, sorted and paginated products
export const getProducts = async (req, res) => {
  try {
    const { category, brand, size, color, minPrice, maxPrice, sort, q, pageNumber, pageSize } = req.query;

    const page = Number(pageNumber) || 1;
    const limit = Number(pageSize) || 12;
    const skip = (page - 1) * limit;

    const filter = {};

    // 1. Text Search or Regex query
    if (q) {
      filter.$text = { $search: q };
    }

    // 2. Category
    if (category && category !== "All") {
      if (category === "New" || category === "Sale") {
        filter.tag = category;
      } else {
        filter.category = category;
      }
    }

    // 3. Brands (comma-separated list)
    if (brand) {
      filter.brand = { $in: brand.split(",") };
    }

    // 4. Sizes (comma-separated list)
    if (size) {
      filter.sizes = { $in: size.split(",") };
    }

    // 5. Colors (comma-separated list)
    if (color) {
      filter.colors = { $in: color.split(",") };
    }

    // 6. Price Range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortFilter = { createdAt: -1 }; // default newest
    if (sort) {
      if (sort === "price_asc") sortFilter = { price: 1 };
      else if (sort === "price_desc") sortFilter = { price: -1 };
      else if (sort === "newest") sortFilter = { createdAt: -1 };
      else if (sort === "rating") sortFilter = { rating: -1 };
    }

    let count = 0;
    let products = [];

    if (q) {
      try {
        count = await Product.countDocuments(filter);
        products = await Product.find(filter)
          .sort(sortFilter)
          .skip(skip)
          .limit(limit);
      } catch (err) {
        // Fallback to regex if text search fails (e.g. index is not fully built yet)
        delete filter.$text;
        const regex = new RegExp(q, "i");
        filter.$or = [
          { name: { $regex: regex } },
          { brand: { $regex: regex } },
          { description: { $regex: regex } },
        ];
        count = await Product.countDocuments(filter);
        products = await Product.find(filter)
          .sort(sortFilter)
          .skip(skip)
          .limit(limit);
      }
    } else {
      count = await Product.countDocuments(filter);
      products = await Product.find(filter)
        .sort(sortFilter)
        .skip(skip)
        .limit(limit);
    }

    res.json({
      products,
      page,
      pages: Math.ceil(count / limit),
      count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch single product details
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin CRUD Helper to align sizes/colors list with variants array
const syncProductFields = (data) => {
  if (data.variants && Array.isArray(data.variants)) {
    data.sizes = [...new Set(data.variants.map((v) => v.size))].filter(Boolean);
    data.colors = [...new Set(data.variants.map((v) => v.color))].filter(Boolean);
  }
  if (data.image && (!data.images || data.images.length === 0)) {
    data.images = [data.image];
  }
  return data;
};

// Admin create product
export const createProduct = async (req, res) => {
  try {
    const payload = syncProductFields(req.body);
    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin update product
export const updateProduct = async (req, res) => {
  try {
    const payload = syncProductFields(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
