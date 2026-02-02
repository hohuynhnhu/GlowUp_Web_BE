const { sql, poolPromise } = require('../config/db');
const vnpayService = require('../services/vnpay_service');

class VNPayController {
  /**
   * Tạo URL thanh toán VNPay
   */
  async createPayment(req, res) {
    try {
      const { orderId, amount, orderInfo, bankCode } = req.body;

      // Lấy IP của client
      const ipAddr = req.headers['x-forwarded-for'] ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     req.connection.socket.remoteAddress;

      // Kiểm tra đơn hàng có tồn tại không
      const pool = await poolPromise;
      const orderResult = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query('SELECT * FROM orders WHERE id = @orderId');

      if (orderResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tồn tại'
        });
      }

      const order = orderResult.recordset[0];

      // Kiểm tra trạng thái đơn hàng
      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Đơn hàng này không thể thanh toán'
        });
      }

      // Tạo payment URL
      const paymentUrl = vnpayService.createPaymentUrl(
        orderId,
        amount || order.total_price,
        orderInfo || `Thanh toán đơn hàng #${orderId}`,
        ipAddr
      );

      // Cập nhật trạng thái đơn hàng sang "processing"
      await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          UPDATE orders 
          SET status = 'processing', 
              payment_method = 'vnpay',
              updated_at = GETDATE()
          WHERE id = @orderId
        `);

      return res.json({
        success: true,
        data: {
          paymentUrl: paymentUrl
        }
      });

    } catch (error) {
      console.error('Create payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Xử lý callback từ VNPay (Return URL)
   */
  async vnpayReturn(req, res) {
    try {
      const vnpParams = req.query;

      // Xác thực chữ ký
      const verifyResult = vnpayService.verifyReturnUrl(vnpParams);

      if (!verifyResult.isValid) {
        // Redirect về trang thất bại
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Invalid signature`);
      }

      const pool = await poolPromise;
      const orderId = verifyResult.orderId;
      const responseCode = verifyResult.responseCode;

      // Lấy thông tin đơn hàng
      const orderResult = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query('SELECT * FROM orders WHERE id = @orderId');

      if (orderResult.recordset.length === 0) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Order not found`);
      }

      // Kiểm tra response code
      if (responseCode === '00') {
        // Giao dịch thành công
        await pool.request()
          .input('orderId', sql.Int, orderId)
          .input('transactionNo', sql.NVarChar, verifyResult.transactionNo)
          .input('bankCode', sql.NVarChar, verifyResult.bankCode)
          .input('payDate', sql.NVarChar, verifyResult.payDate)
          .query(`
            UPDATE orders 
            SET status = 'paid',
                payment_status = 'completed',
                transaction_no = @transactionNo,
                bank_code = @bankCode,
                pay_date = @payDate,
                updated_at = GETDATE()
            WHERE id = @orderId
          `);

        // Redirect về trang thành công
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`);
      } else {
        // Giao dịch thất bại
        await pool.request()
          .input('orderId', sql.Int, orderId)
          .input('responseCode', sql.NVarChar, responseCode)
          .query(`
            UPDATE orders 
            SET status = 'pending',
                payment_status = 'failed',
                payment_note = @responseCode,
                updated_at = GETDATE()
            WHERE id = @orderId
          `);

        const message = vnpayService.getResponseDescription(responseCode);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(message)}`);
      }

    } catch (error) {
      console.error('VNPay return error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
    }
  }

  /**
   * Xử lý IPN (Instant Payment Notification) từ VNPay
   */
  async vnpayIPN(req, res) {
    try {
      const vnpParams = req.query;

      // Xác thực IPN
      const verifyResult = vnpayService.verifyIpn(vnpParams);

      // Nếu chữ ký không hợp lệ
      if (verifyResult.RspCode !== '00') {
        return res.json(verifyResult);
      }

      const pool = await poolPromise;
      const orderId = verifyResult.orderId;

      // Lấy thông tin đơn hàng
      const orderResult = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query('SELECT * FROM orders WHERE id = @orderId');

      if (orderResult.recordset.length === 0) {
        return res.json({
          RspCode: '01',
          Message: 'Order not found'
        });
      }

      const order = orderResult.recordset[0];

      // Kiểm tra số tiền
      if (order.total_price !== verifyResult.amount) {
        return res.json({
          RspCode: '04',
          Message: 'Amount mismatch'
        });
      }

      // Kiểm tra trạng thái đơn hàng
      if (order.payment_status === 'completed') {
        return res.json({
          RspCode: '02',
          Message: 'Order already confirmed'
        });
      }

      // Cập nhật trạng thái đơn hàng
      await pool.request()
        .input('orderId', sql.Int, orderId)
        .input('transactionNo', sql.NVarChar, verifyResult.transactionNo)
        .query(`
          UPDATE orders 
          SET status = 'paid',
              payment_status = 'completed',
              transaction_no = @transactionNo,
              updated_at = GETDATE()
          WHERE id = @orderId
        `);

      // Trả về success cho VNPay
      return res.json({
        RspCode: '00',
        Message: 'Success'
      });

    } catch (error) {
      console.error('VNPay IPN error:', error);
      return res.json({
        RspCode: '99',
        Message: 'System error'
      });
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán
   */
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;

      const pool = await poolPromise;
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT 
            id,
            total_price,
            status,
            payment_method,
            payment_status,
            transaction_no,
            bank_code,
            pay_date,
            created_at,
            updated_at
          FROM orders 
          WHERE id = @orderId
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tồn tại'
        });
      }

      return res.json({
        success: true,
        data: result.recordset[0]
      });

    } catch (error) {
      console.error('Check payment status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái thanh toán',
        error: error.message
      });
    }
  }
}

module.exports = new VNPayController();