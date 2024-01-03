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

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on ${port} ...`);
});
