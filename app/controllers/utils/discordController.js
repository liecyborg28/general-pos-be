const axios = require("axios");

require("dotenv").config();

/**
 * Mengirim pesan ke channel Discord menggunakan Incoming Webhook
 * @param {string} type
 * @param {string} text - Pesan yang ingin dikirim
 * @param {string} [link] - URL opsional yang ingin disertakan sebagai link
 * @returns {Promise<Object>} - Hasil pengiriman pesan
 */
const sendMessageToDiscordWebhook = async (type, text, link = "") => {
  try {
    // URL webhook Discord dari environment variables
    const webhookUrl =
      type === "order"
        ? process.env.DISCORD_ORDER_NOTIFICATION_WEB_HOOK_URL
        : process.env.DISCORD_REQUEST_NOTIFICATION_WEB_HOOK_URL;

    // Jika ada link, tambahkan link ke dalam pesan
    const messageContent = link ? `${text}\n[Klik di sini](${link})` : text;

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
