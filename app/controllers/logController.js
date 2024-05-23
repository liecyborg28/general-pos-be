const Log = require("../models/logModel");
const pageController = require("./utils/pageController");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  createLog: async (req) => {
    new Log(req)
      .save()
      .then((result) => {
        // console.log({
        //   error: false,
        //   data: result,
        //   message: successMessages.LOG_CREATED_SUCCESS,
        // });
      })
      .catch((err) => {
        console.log({ error: true, message: err });
      });
  },

  getLogs: async (req) => {
    let pageKey = req.pageKey ? req.pageKey : 1;
    let pageSize = req.pageSize ? req.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.from || req.by || req.type;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            $or: [
              {
                from: req.from ? req.from : null,
              },
              {
                from: req.by ? req.by : null,
              },
              {
                from: req.type ? req.type : null,
              },
            ],
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Log)
        .then((logs) => {
          resolve({
            error: false,
            data: logs,
            count: logs.count,
          }).catch((err) => {
            reject({ error: true, message: err });
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },
};
