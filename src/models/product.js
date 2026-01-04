const { sql, poolPromise } = require("../config/db");

class ProductModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM products");
    return result.recordset.map((p) => ({
      ...p,
      images: JSON.parse(p.images || "[]"),
    }));
  }
}

module.exports = ProductModel;
