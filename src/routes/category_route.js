const express = require("express");
const router = express.Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/category_controller");
const uploadCategory = require("../middlewares/uploadCategory");
router.get("/", getAll);
router.get("/:id", getById);
router.post("/", uploadCategory.single("image"), create);

router.put("/:id", uploadCategory.single("image"), update);
router.delete("/:id", remove);

module.exports = router;
