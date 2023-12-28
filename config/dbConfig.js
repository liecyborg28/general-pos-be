const MongoDBConfig = {
  // test
  url: "mongodb://localhost:27017/test",
  connectOption: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

module.exports = MongoDBConfig;
