const midtransClient = require('midtrans-client');
const config = require('../config/config');

let snap = new midtransClient.Snap({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey
});

class PaymentGatewayController {
  static async requestPaymentMidtrans(paymentData) {
    try {
      let parameter = {
        "transaction_details": {
          "order_id": paymentData.invoiceNumber,
          "gross_amount": paymentData.amount
        },
        "customer_details": {
          "first_name": paymentData.customerName,
          "email": paymentData.email,
          "phone": paymentData.phoneNumber
        },
        "credit_card": {
          "secure": true
        }
      };

      const transaction = await snap.createTransaction(parameter);
      return {
        paymentUrl: transaction.redirect_url,
        orderId: transaction.order_id
      };
    } catch (error) {
      console.error("Error during Midtrans payment request:", error);
      throw error;
    }
  }
}

module.exports = PaymentGatewayController;