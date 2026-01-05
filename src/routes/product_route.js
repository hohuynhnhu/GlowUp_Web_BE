const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
} = require("../controllers/product_controller");
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/create", CreateProduct);
router.put("/update/:id", UpdateProduct);
router.delete("/delete/:id", DeleteProduct);

module.exports = router;
