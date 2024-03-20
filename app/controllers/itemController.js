const ExcelJS = require("exceljs");
const excelController = require("./utils/excelController");

const User = require("../models/userModel");
const Item = require("../models/itemModel");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

module.exports = {
  getBulkItemTemplate: async (req) => {
    let businessId = req.query.businessId || null;
    let categoryId = req.query.categoryId || null;

    if (businessId && categoryId) {
      return new Promise(async (resolve, reject) => {
        const properties = {
          workbook: "Template_Upload_Daftar_Item",
          worksheet: "Daftar Item",
          title: "Daftar Item",
          data: [
            {
              no: 1,
              name: "Nama menu (wajib)",
              price: "Harga menu (wajib)",
              imageUrl: "URL gambar",
            },
          ],
          hiddenSheets: [
            {
              name: "businessId",
              value: businessId,
            },
            {
              name: "categoryId",
              value: categoryId,
            },
          ],
        };

        excelController
          .generateExcelTemplate(properties)
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      });
    } else {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }
  },

  createBulkItem: async (req) => {
    let dateISOString = new Date().toISOString();

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    return new Promise((resolve, reject) => {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx.load(req.file.buffer).then(async () => {
          const worksheet = workbook.getWorksheet(1);

          const { data, hiddenSheets } = excelController.convertExcelToObject(
            2,
            7,
            worksheet
          );

          let businessId = hiddenSheets.find((e) => e.name === "businessId");

          let categoryId = hiddenSheets.find((e) => e.name === "categoryId");

          let existingItems = [];

          const transformedData = data.map((e) => {
            return {
              status: "active",
              businessId,
              categoryId,
              name: e.name,
              price: e.price,
              imageUrl: e.imageUrl ? e.imageUrl.text : null,
              taxed: true,
              charged: true,
              changedBy: userByToken._id,
              createdAt: dateISOString,
              updatedAt: dateISOString,
            };
          });

          const promises = transformedData.map(async (item) => {
            try {
              let existingItem = await dataController.isExist(
                { businessId: item.businessId, name: item.name },
                Item
              );

              if (!existingItem) {
                await new Item(item).save().then((result) => {
                  logController.createLog({
                    createdAt: dateISOString,
                    title: "Create Item",
                    note: "",
                    type: "item",
                    from: result._id,
                    by: userByToken._id,
                    data: result,
                  });
                });
              } else {
                existingItems.push(item);
              }
            } catch (error) {
              console.log(error);
            }
          });

          await Promise.all(promises);

          if (existingItems.length < 1) {
            resolve({
              error: false,
              message: successMessages.ALL_DATA_SAVED,
            });
          } else if (existingItems.length === data.length) {
            reject({
              error: true,
              message: errorMessages.ALL_DATA_NOT_SAVED_BECAUSE_DUPLICATE,
            });
          } else {
            reject({
              error: true,
              message: errorMessages.SOME_DATA_NOT_SAVED_BECAUSE_DUPLICATE,
            });
          }
        });
      } catch (error) {
        reject({
          error: true,
          message: errorMessages.EXCEL_UPLOAD_ERROR,
        });
      }
    });
  },

  createItem: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.status &&
        body.categoryId &&
        body.name &&
        body.price &&
        body.taxed &&
        body.charged
      );
    };

    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let payload = isBodyValid()
      ? {
          status: body.status,
          businessId: body.businessId,
          name: body.name,
          imageUrl: body.imageUrl ? body.imageUrl : null,
          categoryId: body.categoryId,
          price: body.price,
          changedBy: userByToken._id,
          createdAt: dateISOString,
          updatedAt: dateISOString,
          ingredients: body.ingredients ? body.ingredients : [],
          taxed: body.taxed,
          charged: body.charged,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        { businessId: body.businessId, name: body.name },
        Item
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Item(payload)
          .save()
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Create Item",
              note: "",
              type: "item",
              from: result._id,
              by: userByToken._id,
              data: result,
            });
            resolve({
              error: false,
              data: result,
              message: successMessages.ITEM_CREATED_SUCCESS,
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

  getItems: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return (
        req.query.keyword ||
        req.query.name ||
        req.query.businessId ||
        req.query.categoryId
      );
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            status: { $ne: "deleted" },
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
                price: req.query.price
                  ? { $regex: req.query.price, $options: "i" }
                  : null,
              },
              {
                categoryId: req.query.categoryId ? req.query.categoryId : null,
              },
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
            ],
          }
        : {
            status: { $ne: "deleted" },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, Item)
        .then((items) => {
          Item.populate(items.data, { path: "businessId categoryId" })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: items.count,
              });
            })
            .catch((err) => {
              reject({ error: true, message: err });
            });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  updateItem: async (req) => {
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let body = req.body;

    let nameIsExist = await dataController.isExist(
      { businessId: body.data.businessId, name: body.data.name },
      Item
    );

    if (nameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.NAME_ALREADY_EXISTS,
      });
    }

    if (!body.itemId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    body.data["updatedAt"] = dateISOString;
    body.data["changedBy"] = userByToken._id;

    return new Promise((resolve, reject) => {
      Item.findByIdAndUpdate(body.itemId, body.data, { new: true })
        .then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            title: "Update Item",
            note: body.note ? body.note : "",
            type: "item",
            from: body.itemId,
            by: userByToken._id,
            data: body.data,
          });

          resolve({
            error: false,
            data: result,
            message: successMessages.DATA_SUCCESS_UPDATED,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },
};
