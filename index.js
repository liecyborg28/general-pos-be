// MODE VPS
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const https = require("https");
// const fs = require("fs");
// const http = require("http"); // Untuk redirect HTTP

// const routes = require("./app/routes/routes");
// const dbConfig = require("./config/dbConfig");
// const errorMessages = require("./app/repository/messages/errorMessages");

// const app = express();
// const port = 8081; // Port HTTPS diubah ke 8081

// // --- Path ke sertifikat dan key (Let's Encrypt) ---
// const privateKey = fs.readFileSync(
//   "/etc/letsencrypt/live/berlinpoolbistro.online/privkey.pem",
//   "utf8"
// );
// const certificate = fs.readFileSync(
//   "/etc/letsencrypt/live/berlinpoolbistro.online/fullchain.pem",
//   "utf8"
// );
// const credentials = { key: privateKey, cert: certificate };

// // Koneksi ke MongoDB
// mongoose
//   .connect(dbConfig.url, dbConfig.connectOption)
//   .then(() => console.log("MongoDB connected!"))
//   .catch((err) => console.log(err));

// // Pengaturan CORS
// const corsOptions = {
//   origin: "https://berlinpoolbistro-2024.web.app",
//   credentials: true,
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   allowedHeaders: "Content-Type, Authorization",
// };
// app.use(cors(corsOptions));

// // Parsing body request
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Rute aplikasi
// app.use(routes);

// // Middleware untuk menangani error
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send({ message: errorMessages.SOMETHING_WENT_WRONG });
// });

// // Menjalankan server HTTPS
// https.createServer(credentials, app).listen(port, () => {
//   console.log(`HTTPS server is running on port ${port} ...`);
// });

// // --- Redirect HTTP ke HTTPS (Opsional) ---
// http
//   .createServer((req, res) => {
//     res.writeHead(301, {
//       Location: "https://" + req.headers["host"] + ":" + port + req.url,
//     }); // Tambahkan port di redirect
//     res.end();
//   })
//   .listen(80, () => {
//     console.log("HTTP server running on port 80 and redirecting to HTTPS");
//   });

// [MODE LOCAL]
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const http = require("http"); // Untuk redirect HTTP

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

// Pengaturan CORS
const corsOptions = {
  // origin: "https://berlinpoolbistro-2024.web.app",
  origin: "http://localhost:3000",
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
  console.log(`HTTP server running on port ${port} and redirecting to HTTPS`);
});
