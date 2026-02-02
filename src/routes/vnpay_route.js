const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpay_controller');

/**
 * @route   POST /api/vnpay/create-payment
 * @desc    Tạo URL thanh toán VNPay
 * @access  Private
 */
router.post('/create-payment', vnpayController.createPayment);

/**
 * @route   GET /api/vnpay/return
 * @desc    Xử lý callback từ VNPay sau khi thanh toán
 * @access  Public
 */
router.get('/return', vnpayController.vnpayReturn);

/**
 * @route   GET /api/vnpay/ipn
 * @desc    Xử lý IPN (Instant Payment Notification) từ VNPay
 * @access  Public
 */
router.get('/ipn', vnpayController.vnpayIPN);

/**
 * @route   GET /api/vnpay/payment-status/:orderId
 * @desc    Kiểm tra trạng thái thanh toán của đơn hàng
 * @access  Private
 */
router.get('/payment-status/:orderId', vnpayController.checkPaymentStatus);

module.exports = router;