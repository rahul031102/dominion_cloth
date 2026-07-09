import { Readable } from "node:stream";
import { configureCloudinary } from "../config/cloudinary.js";

const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const cloudinary = configureCloudinary();
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "dc-store/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });

export const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);
    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};