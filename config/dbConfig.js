const MongoDBConfig = {
  // test
  url: "mongodb://localhost:27017/test",
  // prod
  // url: "mongodb+srv://general-pos:ANIMATRONIC@general-pos.lawkplr.mongodb.net/",
  connectOption: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

module.exports = MongoDBConfig;
