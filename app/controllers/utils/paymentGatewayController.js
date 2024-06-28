// TODO: Buat method untuk payment gateway
/*
[27/6, 22.37] Aldil Bhaskoro: Di bagian folder utils yang ada di dalam folder controllers tuh ada file namanya paymentGatewayController kalo tak salah
[27/6, 22.37] Aldil Bhaskoro: Jadi klo aku mau panggil di tempat lain enak tinggal pake method buatan kau
[27/6, 22.37] Aldil Bhaskoro: Aku mau kau tlong bikinkan method terpisah misal method untuk hubungkan ke payment gateway nya di sana
[27/6, 22.37] Aldil Bhaskoro: Soalnya kita buat di dalam suatu class jadi sebutannya method
[27/6, 22.37] Aldil Bhaskoro: Jadi nanti di balanceTransactionController ada pake method di bagian paymentGatwayController jg pas mau connect kan ke midtrans
[27/6, 22.37] Aldil Bhaskoro: Nah di function ini aku mau kau bikin dalam bentuk general. Contoh misal pas mau request pembayaran
[27/6, 22.37] Aldil Bhaskoro: Kau bikinkan satu function yg khusus buat itu di paymentGatewayController
[27/6, 22.37] Aldil Bhaskoro: Habis itu kau panggil di balanceController
*/ 
const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config/config');

class PaymentGatewayController {

  /**
   * Melakukan request pembayaran ke DOKU.
   * @param {Object} paymentData - Data pembayaran.
   * @param {string} paymentData.amount - Jumlah pembayaran.
   * @param {string} paymentData.invoiceNumber - Nomor invoice.
   * @param {string} paymentData.customerName - Nama customer.
   * @param {string} paymentData.email - Email customer.
   * @param {string} paymentData.phoneNumber - Nomor Telepon customer (Opsional)
   * @param {string} [paymentData.paymentMethod] - Metode pembayaran (credit_card, virtual_account, alfamart, indomaret).  
   * @returns {Promise<Object>} - Response dari DOKU.
   * @throws {Error} - Jika terjadi error saat request ke DOKU.
   */
  static async requestPaymentDOKU(paymentData) {
    try {
      const dokuConfig = {
        baseUrl: config.doku.baseUrl, // Ganti dengan base URL DOKU API
        clientId: config.doku.clientId, // Ganti dengan Client ID dari DOKU
        sharedKey: config.doku.sharedKey, // Ganti dengan Shared Key dari DOKU
        mallId: config.doku.mallId  // Ganti dengan Mall ID dari DOKU
      };

      // Validasi payment method
      const validPaymentMethods = ['credit_card', 'virtual_account', 'alfamart', 'indomaret']; 
      if (paymentData.paymentMethod && !validPaymentMethods.includes(paymentData.paymentMethod.toLowerCase())) {
        throw new Error('Metode pembayaran tidak valid');
      }

      // Data yang akan dikirim ke DOKU
      const requestBody = {
        "order": {
            "invoice_number": paymentData.invoiceNumber,
            "amount": parseInt(paymentData.amount),
            "currency": "IDR",
            "payment_method": paymentData.paymentMethod, //  Misal: "virtual_account"
            "additional_data": "Payment API", 
            "customer_name": paymentData.customerName,
            "customer_email": paymentData.email,
            "customer_phone": paymentData.phoneNumber, // Optional
        }
      };

       // Generate words untuk signature
      const words = `${dokuConfig.clientId}${requestBody.order.amount}${requestBody.order.invoice_number}${dokuConfig.sharedKey}`;

      // Generate SHA1 Hash untuk signature
      const signature = crypto.createHash('sha1').update(words).digest('hex');

      // Set headers untuk request
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Client-Id': dokuConfig.clientId,
        'Signature': signature,
      };

      // Lakukan request ke DOKU API endpoint Create Transaction
      const response = await axios.post(
        `${dokuConfig.baseUrl}/api/v2/payment/orders/create`,
        requestBody,
        { headers }
      );

      // Handle response dari DOKU
      if (response.status === 200) {
        return response.data; // Kembalikan data response dari DOKU
      } else {
        throw new Error(`DOKU request failed with status: ${response.status}, message: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error during DOKU payment request:', error);
      throw error; 
    }
  }
}

module.exports = PaymentGatewayController;