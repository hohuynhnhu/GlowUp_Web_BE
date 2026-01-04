const express = require("express");
const router = express.Router();

const { getAllProducts } = require("../controllers/product_controller");
router.get("/", getAllProducts);

module.exports = router;
