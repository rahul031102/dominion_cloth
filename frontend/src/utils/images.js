export const getProductImages = (product) => {
  const images = [
    ...(Array.isArray(product?.images) ? product.images : []),
    product?.image,
  ].filter(Boolean);

  return [...new Set(images)];
};

export const getProductImage = (product) => getProductImages(product)[0] || "";