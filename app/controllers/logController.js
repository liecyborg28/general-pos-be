const Log = require("../models/logModel");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  createLog: async (req) => {
    let isBodyValid = () => {
      return (
        req.title &&
        req.note &&
        req.type &&
        req.from &&
        req.by &&
        req.data &&
        req.createdAt
      );
    };

    let payload = isBodyValid()
      ? {
          title: req.title,
          note: req.note,
          type: req.type,
          from: req.from,
          by: req.by,
          data: req.data,
          createdAt: req.createdAt,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      return new Promise((resolve, reject) => {
        new Log(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.LOG_CREATED_SUCCESS,
            });
          })
          .catch((err) => {
            reject({ error: true, message: err });
          });
      });
    } else {
      return Promise.reject(payload);
    }
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
