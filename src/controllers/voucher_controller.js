const VoucherService = require("../services/voucher_service");

const getAllVouchers = async (req, res) => {
  try {
    const data = await VoucherService.getAllVouchers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getByIdVoucher = async (req, res) => {
  try {
    const data = await VoucherService.getVoucherById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const createVoucher = async (req, res) => {
  try {
    await VoucherService.createVoucher(req.body);
    res.json({ message: "Tạo mã giảm giá thành công" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateVoucher = async (req, res) => {
  try {
    await VoucherService.updateVoucher(req.params.id, req.body);
    res.json({ message: "Cập nhật mã giảm giá thành công" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateStatusVoucher = async (req, res) => {
  try {
    await VoucherService.updateStatus(req.params.id, req.body.status);
    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    await VoucherService.deleteVoucher(req.params.id);
    res.json({ message: "Xóa mã giảm giá thành công" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getAllVouchers,
  getByIdVoucher,
  createVoucher,
  updateVoucher,
  updateStatusVoucher,
  deleteVoucher,
};
