const dbConfig = require("./dbConfig");

module.exports = {
  env: process.env.NODE_ENV || "development",

  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || "YOUR_MIDTRANS_SERVER_KEY", // Ganti dengan Server Key Midtrans
    isProduction: process.env.NODE_ENV === "production",
  },

  database: dbConfig,

  port: process.env.PORT || 3000,
  appSecret: process.env.APP_SECRET || "your_app_secret_key",
};