const ExcelJS = require("exceljs");
const excelController = require("./utils/excelController");
const User = require("../models/userModel");
const Inventory = require("../models/inventoryModel");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

module.exports = {
  getBulkInventoryTemplate: async (req) => {
    let businessId = req.query.id || null;

    if (!businessId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    return new Promise(async (resolve, reject) => {
      const properties = {
        workbook: "Template_Upload_Daftar_Inventory",
        worksheet: "Daftar Inventory",
        title: "Daftar Inventory",
        data: [
          {
            no: 1,
            name: "Nama barang (wajib)",
            early: "Jumlah stok awal",
            min: "Jumlah stok minimum",
            imageUrl: "URL gambar",
          },
        ],
        hiddenSheets: [
          {
            name: "denomination",
            value: req.query.denomination,
          },
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
  },

  createBulkInventory: async (req) => {
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

          let denomination = hiddenSheets.find(
            (e) => e.name === "denomination"
          );

          let existingItems = [];

          const transformedData = data.map((e) => {
            return {
              status: "active",
              businessId,
              categoryId,
              denomination,
              name: e.name,
              imageUrl: e.imageUrl,
              qty: {
                status: "available",
                early: e.early,
                last: e.early,
                min: e.min,
                max: 0,
              },
              changedBy: userByToken._id,
              createdAt: dateISOString,
              updatedAt: dateISOString,
            };
          });

          const promises = transformedData.map(async (item) => {
            try {
              let existingItem = await dataController.isExist(
                { businessId: item.businessId, name: item.name },
                Inventory
              );

              if (!existingItem) {
                await new Inventory(item).save().then((result) => {
                  logController.createLog({
                    createdAt: dateISOString,
                    title: "Create Inventory",
                    note: "",
                    type: "inventory",
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
        console.log(error);
      }
    });
  },

  createInventory: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.status &&
        body.category &&
        body.name &&
        body.early &&
        body.min
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
          categoryId: body.categoryId,
          name: body.name,
          imageUrl: body.imageUrl ? body.imageUrl : null,
          qty: {
            status: "available",
            early: body.early,
            last: body.early,
            min: body.min,
            max: 0,
          },
          changedBy: userByToken._id,
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        { businessId: body.businessId, name: body.name },
        Inventory
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Inventory(payload).save().then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            title: "Create Inventory",
            note: "",
            type: "inventory",
            from: result._id,
            by: userByToken._id,
            data: result,
          });
          resolve({
            error: false,
            data: result,
            message: successMessages.ITEM_CREATED_SUCCESS,
          });
        });
      });
    } else {
      return Promise.reject(payload);
    }
  },

  getInventories: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return (
        req.query.keyword ||
        req.query.name ||
        req.query.businessId ||
        req.query.category
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
        .paginate(pageKey, pageSize, pipeline, Inventory)
        .then((inventories) => {
          Inventory.populate(inventories.data, {
            path: "businessId categoryId",
          })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: inventories.count,
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

  updateInventory: async (req) => {
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let body = req.body;

    if (!body.inventoryId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    body.data["updatedAt"] = dateISOString;
    body.data["changedBy"] = userByToken._id;

    return new Promise((resolve, reject) => {
      Inventory.findByIdAndUpdate(body.inventoryId, body.data, { new: true })
        .then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            title: "Update Inventory",
            note: body.note ? body.note : "",
            type: "inventory",
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
