const ProductModel = require("../models/product");

class ProductService {
  static getAll() {
    return ProductModel.getAll();
  }
}

module.exports = ProductService;
