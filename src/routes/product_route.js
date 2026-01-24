const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

const {
  getAllProducts,
  getProductById,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  getProductsByCategory,
  getUnassignedProducts,
  assignProductsToCategory,
  removeProductFromCategory,
} = require("../controllers/product_controller");

router.get("/unassigned", getUnassignedProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.post("/category/:categoryId", assignProductsToCategory);
router.delete("/category/:categoryId/:productId", removeProductFromCategory);

router.get("/", getAllProducts);
router.post("/create", upload.array("images", 5), CreateProduct);
router.put("/update/:id", upload.array("images", 5), UpdateProduct);
router.delete("/delete/:id", DeleteProduct);
router.get("/:id", getProductById);

module.exports = router;
