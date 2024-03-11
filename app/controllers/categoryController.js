const Category = require("../models/categoryModel");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  createCategory: async (body) => {
    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return body.name && body.businessId && body.type && body.subtype;
    };

    let payload = isBodyValid()
      ? {
          name: body.name,
          businessId: body.businesssId,
          type: body.type,
          subtype: body.subtype,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        { name: body.name },
        Category
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Category(payload)
          .save()
          .then(() => {
            resolve({
              error: false,
              message: successMessages.CATEGORY_CREATED_SUCCESS,
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

  getCategorys: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : 10;

    isNotEveryQueryNull = () => {
      return (
        req.query.keyword ||
        req.query.name ||
        req.query.businessId ||
        req.query.type
      );
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            $or: [
              {
                name: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                name: req.query.name
                  ? { $regex: req.query.name, $options: "i" }
                  : null,
              },
              {
                businessId: req.query.businessId
                  ? { $regex: req.query.businessId, $options: "i" }
                  : null,
              },
              {
                type: req.query.type
                  ? { $regex: req.query.type, $options: "i" }
                  : null,
              },
            ],
          }
        : {};

      pageController
        .paginate(pageKey, pageSize, pipeline, Category)
        .then((categorys) => {
          resolve({
            error: false,
            data: categorys.data,
            count: categorys.count,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  updateCategory: async (body) => {
    let dateISOString = new Date().toISOString();
    let nameIsExist = await dataController.isExist(
      { name: body.data.name, businessId: body.data.businessId },
      Category
    );

    if (nameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.NAME_ALREADY_EXISTS,
      });
    }

    if (!body.categoryId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;
      return new Promise((resolve, reject) => {
        Category.findByIdAndUpdate(body.businessId, body.data, { new: true })
          .then(() => {
            resolve({
              error: false,
              message: successMessages.DATA_SUCCESS_UPDATED,
            });
          })
          .catch((err) => {
            reject({ error: true, message: err });
          });
      });
    }
  },
};
