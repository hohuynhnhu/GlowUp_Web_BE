const { sql, poolPromise } = require("../config/db");

const CategoryModel = {
  findAll: async () => {
    const pool = await poolPromise;
    return pool.request().query("SELECT * FROM categories");
  },

  findById: async (id) => {
    const pool = await poolPromise;
    return pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM categories WHERE id = @id");
  },

  create: async ({ name, description, image }) => {
    const pool = await poolPromise;
    return pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("description", sql.NVarChar, description)
      .input("image", sql.VarChar, image).query(`
        INSERT INTO categories (name, description, image)
        VALUES (@name, @description, @image)
      `);
  },

  update: async (id, { name, description, image }) => {
    const pool = await poolPromise;
    return pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("description", sql.NVarChar, description)
      .input("image", sql.VarChar, image).query(`
        UPDATE categories
        SET name = @name,
            description = @description,
            image = @image
        WHERE id = @id
      `);
  },

  delete: async (id) => {
    const pool = await poolPromise;
    return pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM categories WHERE id = @id");
  },
};

module.exports = CategoryModel;
