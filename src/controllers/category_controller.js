const CategoryService = require("../services/category_service");
const fs = require("fs");
const path = require("path");

const getAll = async (req, res) => {
  try {
    const result = await CategoryService.getAllCategories();
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await CategoryService.getCategoryById(req.params.id);
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
    }

    const image = req.file ? `${req.file.filename}` : null;

    await CategoryService.createCategory({
      name,
      description,
      image,
    });

    res.status(201).json({ message: "Tạo danh mục thành công" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = req.params.id;

    // Lấy category cũ
    const old = await CategoryService.getCategoryById(id);
    if (!old.recordset[0]) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    const oldImage = old.recordset[0].image;
    let image = oldImage;

    // Nếu upload ảnh mới
    if (req.file) {
      image = req.file.filename;

      if (oldImage) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "uploads",
          "categories",
          oldImage
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    await CategoryService.updateCategory(id, {
      name,
      description,
      image,
    });

    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const id = req.params.id;

    const old = await CategoryService.getCategoryById(id);
    if (!old.recordset[0]) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    const image = old.recordset[0].image;

    if (image) {
      const imagePath = path.join(
        __dirname,
        "..",
        "uploads",
        "categories",
        image
      );

      console.log("DELETE IMAGE:", imagePath);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await CategoryService.deleteCategory(id);

    res.json({ message: "Xóa danh mục thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
