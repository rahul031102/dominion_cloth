import Product from "../models/Product.js";
import { configureCloudinary } from "../config/cloudinary.js";

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => (typeof item === "string" ? item.trim() : item)).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
  }

  return [];
};

const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  if (!url.includes("cloudinary.com")) {
    return "";
  }

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = pathParts.indexOf("upload");

    if (uploadIndex === -1 || uploadIndex >= pathParts.length - 1) {
      return "";
    }

    const publicIdParts = pathParts.slice(uploadIndex + 1).filter((part) => !/^v\d+$/.test(part));
    if (publicIdParts.length === 0) {
      return "";
    }

    const lastPart = publicIdParts.pop();
    publicIdParts.push(lastPart.replace(/\.[^.]+$/, ""));
    return publicIdParts.join("/");
  } catch {
    return "";
  }
};

const normalizeImageRecords = (data) => {
  const images = Array.isArray(data.images)
    ? data.images.map((image) => {
        if (typeof image === "string") {
          return { url: image, publicId: "" };
        }

        if (image && typeof image === "object") {
          return {
            url: image.url || image.src || image.image || "",
            publicId: image.publicId || image.public_id || "",
          };
        }

        return { url: "", publicId: "" };
      })
    : [];

  const publicIds = normalizeList(data.imagePublicIds);
  const mainUrl = typeof data.image === "string" ? data.image.trim() : "";
  const mainPublicId = typeof data.imagePublicId === "string" ? data.imagePublicId.trim() : "";

  const mergedRecords = images.length > 0 ? images : [];

  if (mainUrl) {
    if (mergedRecords.length === 0) {
      mergedRecords.push({ url: mainUrl, publicId: mainPublicId });
    } else if (mergedRecords[0].url !== mainUrl) {
      mergedRecords.unshift({ url: mainUrl, publicId: mainPublicId });
    } else if (!mergedRecords[0].publicId && mainPublicId) {
      mergedRecords[0].publicId = mainPublicId;
    }
  }

  mergedRecords.forEach((record, index) => {
    if (!record.publicId) {
      record.publicId = publicIds[index] || extractPublicIdFromUrl(record.url) || "";
    }
    if (!record.url) {
      record.url = data.image || "";
    }
  });

  const filteredRecords = mergedRecords.filter((record) => record.url);

  data.images = filteredRecords.map((record) => record.url);
  data.imagePublicIds = filteredRecords.map((record) => record.publicId).filter(Boolean);
  data.image = data.images[0] || data.image || "";
  data.imagePublicId = filteredRecords[0]?.publicId || mainPublicId || extractPublicIdFromUrl(data.image) || "";

  return data;
};

const collectPublicIds = (productLike) => {
  const publicIds = new Set();

  if (productLike?.imagePublicId) {
    publicIds.add(productLike.imagePublicId);
  }

  if (Array.isArray(productLike?.imagePublicIds)) {
    productLike.imagePublicIds.filter(Boolean).forEach((publicId) => publicIds.add(publicId));
  }

  if (Array.isArray(productLike?.images)) {
    productLike.images.forEach((image, index) => {
      if (image && typeof image === "object") {
        if (image.publicId) {
          publicIds.add(image.publicId);
        } else if (image.public_id) {
          publicIds.add(image.public_id);
        } else if (image.url) {
          const extracted = extractPublicIdFromUrl(image.url);
          if (extracted) publicIds.add(extracted);
        }
        return;
      }

      const explicitPublicId = Array.isArray(productLike?.imagePublicIds) ? productLike.imagePublicIds[index] : "";
      if (explicitPublicId) {
        publicIds.add(explicitPublicId);
        return;
      }

      const extracted = extractPublicIdFromUrl(image || productLike?.image || "");
      if (extracted) {
        publicIds.add(extracted);
      }
    });
  } else if (productLike?.image) {
    const extracted = extractPublicIdFromUrl(productLike.image);
    if (extracted) {
      publicIds.add(extracted);
    }
  }

  return [...publicIds].filter(Boolean);
};

const cleanupCloudinaryAssets = async (publicIds) => {
  const uniquePublicIds = [...new Set(publicIds.filter(Boolean))];
  if (uniquePublicIds.length === 0) {
    return;
  }

  try {
    const cloudinary = configureCloudinary();
    await Promise.allSettled(
      uniquePublicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, { invalidate: true })
      )
    );
  } catch (error) {
    console.warn("Cloudinary cleanup skipped:", error.message);
  }
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

  data = normalizeImageRecords(data);

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
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    const payload = syncProductFields(req.body);
    const previousPublicIds = collectPublicIds(existingProduct);
    const nextPublicIds = collectPublicIds(payload);
    const removedPublicIds = previousPublicIds.filter((publicId) => !nextPublicIds.includes(publicId));

    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    await cleanupCloudinaryAssets(removedPublicIds);

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await Product.deleteOne({ _id: req.params.id });
    await cleanupCloudinaryAssets(collectPublicIds(product));

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
