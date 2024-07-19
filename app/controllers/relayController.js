const axios = require('axios');

// Ganti dengan IP ESP32 Anda
const ESP32_IP = '192.168.5.249';

// Fungsi untuk mengontrol relay
exports.controlRelay = async (req, res) => {
    let { action, meja } = req.body;

    meja = parseInt(meja, 10); // Konversi meja menjadi integer
    const relayId = meja - 1; // Mengonversi meja ke ID relay, relay terakhir cadangan

    if (relayId < 0 || relayId >= 18 || (action !== 'on' && action !== 'off')) {
        return res.status(400).send('Invalid parameters');
    }

    try {
        await axios.get(`http://${ESP32_IP}/relay/${action}?id=${relayId}`);
        res.send(`Meja ${meja.toString().padStart(3, '0')} ${action.toUpperCase()}`);
    } catch (error) {
        res.status(500).send('Error controlling relay');
    }
};
