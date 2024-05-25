const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const routes = require("./app/routes/routes");
const dbConfig = require("./config/dbConfig");
const errorMessages = require("./app/repository/messages/errorMessages");

const app = express();
const port = 8081;

// Koneksi ke MongoDB
mongoose
  .connect(dbConfig.url, dbConfig.connectOption)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log(err));

// Pengaturan CORS menggunakan middleware cors
const corsOptions = {
  origin: "http://localhost:3000", // Ubah dengan URL frontend Anda
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));

// Parsing body request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute aplikasi
app.use(routes);

// Middleware untuk menangani error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    message: errorMessages.SOMETHING_WENT_WRONG,
  });
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server is running on port ${port} ...`);
});
