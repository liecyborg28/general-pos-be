const axios = require("axios");

require("dotenv").config();

/**
 * Mengirim pesan ke channel Slack menggunakan Incoming Webhook
 * @param {string} type
 * @param {string} text - Pesan yang ingin dikirim
 * @returns {Promise<Object>} - Hasil pengiriman pesan
 */
const sendMessageToSlackWebhook = async (type, text, link) => {
  try {
    // Ganti dengan URL webhook yang Anda buat
    const webhookUrl =
      type === "order"
        ? process.env.SLACK_ORDER_NOTIFICATION_WEB_HOOK_URL
        : process.env.SLACK_REQUEST_NOTIFICATION_WEB_HOOK_URL;
    const response = await axios.post(webhookUrl, {
      text: link ? `${text}\n<${link}|Klik di sini>` : text,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message to Slack:", error);
    throw error;
  }
};

module.exports = {
  sendMessageToSlackWebhook,
};
