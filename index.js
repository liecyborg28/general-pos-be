// [MODE LOCAL]
// core
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const mongoose = require("mongoose");

// custom
const app = express();
const dbConfig = require("./config/dbConfig");
const errorMessages = require("./app/repository/messages/errorMessages");
const routes = require("./app/routers/routers/routers");

const port = 8081;

// Koneksi ke MongoDB
mongoose
  .connect(dbConfig.url, dbConfig.connectOption)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log(err));

// Pengaturan CORS
const corsOptions = {
  origin: "http://localhost:4200",
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
  res.status(500).send({ message: errorMessages.SOMETHING_WENT_WRONG });
});

app.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});
