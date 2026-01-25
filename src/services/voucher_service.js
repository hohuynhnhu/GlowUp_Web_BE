const VoucherModel = require("../models/voucher_model");

class VoucherService {
  static async getAllVouchers() {
    return await VoucherModel.getAll();
  }

  static async getVoucherById(id) {
    const voucher = await VoucherModel.getById(id);
    if (!voucher) throw new Error("Voucher không tồn tại");
    return voucher;
  }

  static async createVoucher(data) {
    if (data.discount_type === "percent" && data.discount_value > 100) {
      throw new Error("Giảm theo % không được vượt quá 100");
    }

    if (new Date(data.start_date) >= new Date(data.end_date)) {
      throw new Error("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");
    }

    const existed = await VoucherModel.getByCode(data.code);
    if (existed) {
      throw new Error("Mã giảm giá đã tồn tại");
    }

    await VoucherModel.create(data);
  }

  static async updateVoucher(id, data) {
    await VoucherModel.update(id, data);
  }

  static async updateStatus(id, status) {
    await VoucherModel.updateStatus(id, status);
  }

  static async deleteVoucher(id) {
    await VoucherModel.delete(id);
  }
}

module.exports = VoucherService;
