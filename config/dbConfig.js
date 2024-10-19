require("dotenv").config();

const MongoDBConfig = {
  // test
  url: process.env.DB_URL,
  connectOption: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

module.exports = MongoDBConfig;
