const User = require("../models/userModel");

async function authenticateUser(req, res, next) {
  try {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(401).json({ message: "Unauthorized: Token tidak tersedia" });
    }

    const token = bearerHeader.split(" ")[1];

    // Cari user berdasarkan token di database
    const user = await User.findOne({ "auth.accessToken": token });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: Token tidak valid" });
    }

    // Simpan data user di req.user
    req.user = user;

    // Lanjutkan ke middleware/controller selanjutnya
    next();

  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = authenticateUser;