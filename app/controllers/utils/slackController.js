const axios = require("axios");

require("dotenv").config();

// Ganti dengan URL webhook yang Anda buat
const webhookUrl = process.env.SLACK_APP_NOTIFICATION_WEB_HOOK_URL;

/**
 * Mengirim pesan ke channel Slack menggunakan Incoming Webhook
 * @param {string} text - Pesan yang ingin dikirim
 * @returns {Promise<Object>} - Hasil pengiriman pesan
 */
const sendMessageToSlackWebhook = async (text, link) => {
  try {
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
