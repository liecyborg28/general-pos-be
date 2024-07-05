// config.js
const dbConfig = require("./dbConfig");

module.exports = {
  // Konfigurasi Environment
  env: process.env.NODE_ENV || "development",

  // Konfigurasi DOKU
  doku: {
    baseUrl: process.env.DOKU_BASE_URL || "",
    clientId: process.env.DOKU_CLIENT_ID || "",
    sharedKey: process.env.DOKU_SHARED_KEY || "YOUR_DOKU_SHARED_KEY",
    mallId: process.env.DOKU_MALL_ID || "YOUR_DOKU_MALL_ID",
    publicKey: process.env.DOKU_PUBLIC_KEY || "",
  },

  // Konfigurasi Database (menggunakan dbConfig.js)
  database: dbConfig,

  // Konfigurasi Aplikasi Umum
  port: process.env.PORT || 3000,
  appSecret: process.env.APP_SECRET || "your_app_secret_key",
};
