const axios = require("axios");

// Ganti dengan IP ESP32 Anda
const ESP32_IP = "192.168.62.214";

exports.controlRelay = async (req, res) => {
  let { action, tableNumber } = req.body;

  tableNumber = parseInt(tableNumber, 10); // Konversi meja menjadi integer
  const relayId = tableNumber - 1; // Mengonversi meja ke ID relay, relay terakhir cadangan

  if (relayId < 0 || relayId >= 18 || (action !== "on" && action !== "off")) {
    return Promise.reject(new Error("Invalid parameters"));
  }

  try {
    await axios.get(`http://${ESP32_IP}/relay/${action}?id=${relayId}`);
    return `Meja ${tableNumber
      .toString()
      .padStart(3, "0")} ${action.toUpperCase()}`;
  } catch (error) {
    return Promise.reject(new Error("Error controlling relay"));
  }
};
