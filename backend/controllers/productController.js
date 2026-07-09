import Product from "../models/Product.js";

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => (typeof item === "string" ? item.trim() : item)).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
  }

  return [];
};

const buildVariants = (data) => {
  const sizes = normalizeList(data.sizes);
  const colors = normalizeList(data.colors);
  const stock = Number(data.stock ?? 0);

  if (Array.isArray(data.variants) && data.variants.length > 0) {
    data.variants = data.variants
      .map((variant) => ({
        size: variant.size?.trim(),
        color: variant.color?.trim(),
        stock: Number(variant.stock ?? stock),
      }))
      .filter((variant) => variant.size && variant.color);
  } else if (sizes.length > 0 && colors.length > 0) {
    data.variants = sizes.flatMap((size) =>
      colors.map((color) => ({
        size,
        color,
        stock,
      }))
    );
  } else if (sizes.length > 0) {
    data.variants = sizes.map((size) => ({
      size,
      color: colors[0] || "Default",
      stock,
    }));
  } else if (colors.length > 0) {
    data.variants = colors.map((color) => ({
      size: "Default",
      color,
      stock,
    }));
  } else {
    data.variants = [];
  }

  data.sizes = sizes;
  data.colors = colors;
  data.stock = data.variants.length
    ? data.variants.reduce((total, variant) => total + Number(variant.stock || 0), 0)
    : stock;

  return data;
};

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
  if (data.price !== undefined) {
    data.price = Number(data.price);
  }
  if (data.mrp !== undefined) {
    data.mrp = Number(data.mrp);
  }
  if (data.stock !== undefined) {
    data.stock = Number(data.stock);
  }

  data.images = normalizeList(data.images);
  if (data.image) {
    data.images = [data.image, ...data.images.filter((url) => url !== data.image)];
  }
  if (!data.image && data.images.length > 0) {
    data.image = data.images[0];
  }

  return buildVariants(data);
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

// Create product review
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed" });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment: comment || "",
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added successfully", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
