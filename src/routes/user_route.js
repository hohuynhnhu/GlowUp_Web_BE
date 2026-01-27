const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  postCreateUser,
  UpdateUser,
  DeleteUser,
} = require("../controllers/user_controller");
const auth = require("../middlewares/auth");

router.get("/", auth, getAllUsers);
router.get("/:id", getUserById);
router.post("/create-user", postCreateUser);
router.put("/update-user/:id", UpdateUser);
router.delete("/delete-user/:id", DeleteUser);

module.exports = router;
