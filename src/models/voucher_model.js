const { sql, poolPromise } = require("../config/db");

class VoucherModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM vouchers
      ORDER BY created_at DESC
    `);
    return result.recordset;
  }

  static async getById(id) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`SELECT * FROM vouchers WHERE id = @id`);
    return result.recordset[0];
  }

  static async getByCode(code) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("code", sql.NVarChar, code)
      .query(`SELECT id FROM vouchers WHERE code = @code`);
    return result.recordset[0];
  }

  static async create(data) {
    const pool = await poolPromise;

    await pool
      .request()
      .input("code", sql.NVarChar, data.code)
      .input("discount_type", sql.NVarChar, data.discount_type)
      .input("discount_value", sql.Decimal(12, 0), data.discount_value)
      .input("min_order_value", sql.Decimal(12, 0), data.min_order_value || 0)
      .input("max_discount", sql.Decimal(12, 0), data.max_discount || null)
      .input("quantity", sql.Int, data.quantity)
      .input("start_date", sql.DateTime, data.start_date)
      .input("end_date", sql.DateTime, data.end_date).query(`
        INSERT INTO vouchers (
          code, discount_type, discount_value,
          min_order_value, max_discount,
          quantity, start_date, end_date, status
        )
        VALUES (
          @code, @discount_type, @discount_value,
          @min_order_value, @max_discount,
          @quantity, @start_date, @end_date, 'active'
        )
      `);
  }

  static async update(id, data) {
    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("code", sql.NVarChar, data.code)
      .input("discount_type", sql.NVarChar, data.discount_type)
      .input("discount_value", sql.Decimal(12, 0), data.discount_value)
      .input("min_order_value", sql.Decimal(12, 0), data.min_order_value || 0)
      .input("max_discount", sql.Decimal(12, 0), data.max_discount || null)
      .input("quantity", sql.Int, data.quantity)
      .input("start_date", sql.DateTime, data.start_date)
      .input("end_date", sql.DateTime, data.end_date).query(`
        UPDATE vouchers SET
          code = @code,
          discount_type = @discount_type,
          discount_value = @discount_value,
          min_order_value = @min_order_value,
          max_discount = @max_discount,
          quantity = @quantity,
          start_date = @start_date,
          end_date = @end_date
        WHERE id = @id
      `);
  }

  static async updateStatus(id, status) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("status", sql.NVarChar, status)
      .query(`UPDATE vouchers SET status = @status WHERE id = @id`);
  }

  static async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM vouchers WHERE id = @id`);
  }
}

module.exports = VoucherModel;
