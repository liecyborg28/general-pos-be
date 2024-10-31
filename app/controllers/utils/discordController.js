const axios = require("axios");

require("dotenv").config();

// URL webhook Discord dari environment variables
const webhookUrl = process.env.DISCORD_APP_NOTIFICATION_WEB_HOOK_URL;

/**
 * Mengirim pesan ke channel Discord menggunakan Incoming Webhook
 * @param {string} text - Pesan yang ingin dikirim
 * @param {string} [link] - URL opsional yang ingin disertakan sebagai link
 * @returns {Promise<Object>} - Hasil pengiriman pesan
 */
const sendMessageToDiscordWebhook = async (text, link = "") => {
  try {
    // Jika ada link, tambahkan link ke dalam pesan
    const messageContent = link ? `${text}\n[Klik di sini](${link})` : content;

    const response = await axios.post(webhookUrl, {
      content: messageContent,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message to Discord:", error);
    throw error;
  }
};

module.exports = {
  sendMessageToDiscordWebhook,
};
