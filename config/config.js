const dbConfig = require("./dbConfig");

module.exports = {
  env: process.env.NODE_ENV || "development",

  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-V7hiZ2ORAhh4pZeH9ku1Rm0C", // Ganti dengan Server Key Midtrans
    isProduction: process.env.NODE_ENV === "Development",
  },

  database: dbConfig,

  port: process.env.PORT || 3000,
  appSecret: process.env.APP_SECRET || "your_app_secret_key",
};