const ProductModel = require("../models/product");

class ProductService {
  static getAll() {
    return ProductModel.getAll();
  }

  static getById(id) {
    return ProductModel.getById(id);
  }

  static create(data) {
    return ProductModel.create(data);
  }

  static update(id, data) {
    return ProductModel.update(id, data);
  }
  static delete(id) {
    return ProductModel.delete(id);
  }
}

module.exports = ProductService;
