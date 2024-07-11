const jwt = require('jsonwebtoken');
const User = require("../models/userModel");
const config = require('../config/config');

async function authenticateUser(req, res, next) {
  try {
    // 1. Ambil token dari header Authorization
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(401).json({ message: "Unauthorized: Token tidak tersedia" });
    }
    const token = bearerHeader.split(" ")[1]; 

    // 2. Verifikasi token
    jwt.verify(token, config.appSecret, async (err, decoded) => {
      if (err) {
        console.error("Error verifikasi token:", err);
        return res.status(401).json({ message: "Unauthorized: Token tidak valid" });
      }

      // 3. Cari user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized: User tidak ditemukan" });
      }

      // 4. Simpan data user di req.user
      req.user = user; 
      // 5. Lanjutkan ke middleware/controller selanjutnya 
      next(); 
    });

  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = authenticateUser;