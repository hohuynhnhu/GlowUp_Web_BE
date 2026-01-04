const ProductService = require("../services/product_service");

const getAllProducts = async (req, res) => {
  const data = await ProductService.getAll();
  res.json(data);
};

module.exports = {
  getAllProducts,
};
