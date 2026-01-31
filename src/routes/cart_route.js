const express = require("express");
const router = express.Router();

const {
  getCartByUserId,
  addItemToCart,
  createCart,
} = require("../controllers/cart_controller");

router.get("/user/:userId", getCartByUserId);
router.post("/add", addItemToCart);
router.post("/create", createCart);

module.exports = router;
