export const getProductImages = (product) => {
  const images = [];

  const appendImage = (image) => {
    if (!image) return;
    if (typeof image === "string") {
      images.push(image);
      return;
    }

    if (typeof image === "object") {
      const url = image.url || image.src || image.image;
      if (url) images.push(url);
    }
  };

  if (Array.isArray(product?.images)) {
    product.images.forEach(appendImage);
  }

  appendImage(product?.image);

  return [...new Set(images)];
};

export const getProductImage = (product) => getProductImages(product)[0] || "";