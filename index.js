const express = require("express");
const mongoose = require("mongoose");

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
app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on ${port} ...`);
});
