const crypto = require('crypto');
const querystring = require('querystring');
const dateFormat = require('dateformat');

class VNPayService {
  constructor() {
    this.vnp_TmnCode = process.env.VNP_TMN_CODE;
    this.vnp_HashSecret = process.env.VNP_HASH_SECRET;
    this.vnp_Url = process.env.VNP_URL;
    this.vnp_ReturnUrl = process.env.VNP_RETURN_URL;
    this.vnp_IpnUrl = process.env.VNP_IPN_URL;
  }

  /**
   * Sắp xếp object theo key
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Tạo URL thanh toán VNPay
   * @param {number} orderId - ID đơn hàng
   * @param {number} amount - Số tiền (VNĐ)
   * @param {string} orderInfo - Thông tin đơn hàng
   * @param {string} ipAddr - IP address của khách hàng
   * @param {string} locale - Ngôn ngữ (vn hoặc en)
   * @returns {string} URL thanh toán
   */
  createPaymentUrl(orderId, amount, orderInfo, ipAddr, locale = 'vn') {
    const date = new Date();
    const createDate = dateFormat(date, 'yyyymmddHHMMss');
    
    // Thời gian hết hạn: 15 phút
    const expireDate = dateFormat(new Date(date.getTime() + 15 * 60 * 1000), 'yyyymmddHHMMss');

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay yêu cầu số tiền * 100
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate
    };

    // Sắp xếp params
    vnp_Params = this.sortObject(vnp_Params);

    // Tạo query string
    const signData = querystring.stringify(vnp_Params, { encode: false });
    
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    // Tạo URL
    const paymentUrl = this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

    return paymentUrl;
  }

  /**
   * Xác thực callback từ VNPay
   * @param {object} vnpParams - Params từ VNPay trả về
   * @returns {object} Kết quả xác thực
   */
  verifyReturnUrl(vnpParams) {
    const secureHash = vnpParams['vnp_SecureHash'];
    
    // Xóa các trường không cần thiết
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sắp xếp params
    const sortedParams = this.sortObject(vnpParams);
    
    // Tạo sign data
    const signData = querystring.stringify(sortedParams, { encode: false });
    
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // So sánh secure hash
    if (secureHash === signed) {
      return {
        isValid: true,
        orderId: vnpParams['vnp_TxnRef'],
        amount: vnpParams['vnp_Amount'] / 100,
        responseCode: vnpParams['vnp_ResponseCode'],
        transactionNo: vnpParams['vnp_TransactionNo'],
        bankCode: vnpParams['vnp_BankCode'],
        payDate: vnpParams['vnp_PayDate'],
        transactionStatus: vnpParams['vnp_TransactionStatus']
      };
    }

    return {
      isValid: false,
      message: 'Invalid signature'
    };
  }

  /**
   * Xác thực IPN (Instant Payment Notification) từ VNPay
   * @param {object} vnpParams - Params từ VNPay gửi đến IPN URL
   * @returns {object} Response cho VNPay
   */
  verifyIpn(vnpParams) {
    const secureHash = vnpParams['vnp_SecureHash'];
    const orderId = vnpParams['vnp_TxnRef'];
    const responseCode = vnpParams['vnp_ResponseCode'];

    // Xóa các trường không cần thiết
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sắp xếp params
    const sortedParams = this.sortObject(vnpParams);
    
    // Tạo sign data
    const signData = querystring.stringify(sortedParams, { encode: false });
    
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Kiểm tra secure hash
    if (secureHash !== signed) {
      return {
        RspCode: '97',
        Message: 'Invalid signature'
      };
    }

    // Kiểm tra response code
    if (responseCode === '00') {
      return {
        RspCode: '00',
        Message: 'Success',
        orderId: orderId,
        amount: vnpParams['vnp_Amount'] / 100,
        transactionNo: vnpParams['vnp_TransactionNo']
      };
    } else {
      return {
        RspCode: responseCode,
        Message: 'Transaction failed',
        orderId: orderId
      };
    }
  }

  /**
   * Lấy mô tả response code
   * @param {string} code - Response code từ VNPay
   * @returns {string} Mô tả
   */
  getResponseDescription(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };

    return messages[code] || 'Không xác định';
  }
}

module.exports = new VNPayService();