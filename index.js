const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const routes = require("./app/routes/routes");
const dbConfig = require("./config/dbConfig");

const app = express();

const port = 8081;

mongoose
  .connect(dbConfig.url, dbConfig.connectOption)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Middleware ini akan mengatur header CORS untuk semua rute
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Mengizinkan akses dari berbagai domain
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on ${port} ...`);
});
