// require("dotenv").config();

// // [MODE LOCAL]
// // core
// const cors = require("cors");
// const express = require("express");
// const mongoose = require("mongoose");

// // custom
// const app = express();
// const dbConfig = require("./config/dbConfig");
// const errorMessages = require("./app/repository/messages/errorMessages");
// const routes = require("./app/routers/routers/routers");

// const port = process.env.PORT;

// const allowedIp = process.env.ALLOWED_IP;

// // Koneksi ke MongoDB
// mongoose
//   .connect(dbConfig.url, dbConfig.connectOption)
//   .then(() => console.log("MongoDB connected!"))
//   .catch((err) => console.log(err));

// // Pengaturan CORS
// const corsOptions = {
//   origin: "*",
//   credentials: true,
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   allowedHeaders: "Content-Type, Authorization",
// };

// app.use(cors(corsOptions));

// // Parsing body request
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// // Rute aplikasi
// app.use(routes);

// // Middleware untuk menangani error
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send({ message: errorMessages.SOMETHING_WENT_WRONG });
// });

// app.listen(port, allowedIp, () => {
//   console.log(`HTTP server running on port ${port}`);
// });

require("dotenv").config();

const cors = require("cors");
const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const https = require("https");

// custom
const app = express();
const dbConfig = require("./config/dbConfig");
const errorMessages = require("./app/repository/messages/errorMessages");
const routes = require("./app/routers/routers/routers");

const port = process.env.PORT;
const allowedIp = process.env.ALLOWED_IP;

// Load SSL Certificate
const options = {
  key: fs.readFileSync("/etc/ssl/mycert/server.key"),
  cert: fs.readFileSync("/etc/ssl/mycert/server.crt"),
};

mongoose
  .connect(dbConfig.url, dbConfig.connectOption)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log(err));

// Pengaturan CORS
const corsOptions = {
  origin: "*",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parsing body request
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Rute aplikasi
app.use(routes);

// Tes API
app.get("/", (req, res) => {
  res.send("Hello, Secure World!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: errorMessages.SOMETHING_WENT_WRONG });
});

// Jalankan server HTTPS
https.createServer(options, app).listen(port, allowedIp, () => {
  console.log(`HTTPS server running on https://141.136.47.185:${port}`);
});
