const ExcelJS = require("exceljs");
const excelController = require("./utils/excelController");

const User = require("../models/userModel");
const Product = require("../models/productModel");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");
const logController = require("./logController");

module.exports = {
  getBulkProductTemplate: async (req) => {
    let businessId = req.query.businessId || null;
    let categoryId = req.query.categoryId || null;

    if (businessId && categoryId) {
      return new Promise(async (resolve, reject) => {
        const properties = {
          workbook: "Template_Upload_Daftar_Produk",
          worksheet: "Daftar Produk",
          title: "Daftar Produk",
          data: [
            {
              no: 1,
              name: "Nama Produk (wajib)",
              cost: "Biaya Produksi (wajib)",
              price: "Harga Produk (wajib)",
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

  createBulkProduct: async (req) => {
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

          let existingProducts = [];

          const transformedData = data.map((e) => {
            return {
              status: "active",
              businessId: businessId.value,
              categoryId: categoryId.value,
              name: e.name,
              price: e.price,
              imageUrl: e.imageUrl ? e.imageUrl : "",
              taxed: true,
              charged: true,
              changedBy: userByToken._id,
              createdAt: dateISOString,
              updatedAt: dateISOString,
            };
          });

          const promises = transformedData.map(async (product) => {
            try {
              let existingProduct = await dataController.isExist(
                {
                  businessId: Product.businessId,
                  name: Product.name,
                  status: { $ne: "deleted" },
                },
                Product
              );

              if (!existingProduct) {
                await new Product(product).save().then((result) => {
                  logController.createLog({
                    createdAt: dateISOString,
                    title: "Create Product",
                    note: "",
                    type: "Product",
                    from: result._id,
                    by: userByToken._id,
                    data: result,
                  });
                });
              } else {
                existingProducts.push(product);
              }
            } catch (error) {
              console.log(error);
            }
          });

          await Promise.all(promises);

          if (existingProducts.length < 1) {
            resolve({
              error: false,
              message: successMessages.ALL_DATA_SAVED,
            });
          } else if (existingProducts.length === data.length) {
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

  createProduct: async (req) => {
    let dateISOString = new Date().toISOString();
    let body = req.body;

    let isBodyValid = () => {
      return (
        body.businessId &&
        body.status &&
        body.categoryId &&
        body.name &&
        body.price
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
        {
          businessId: body.businessId,
          name: body.name,
          status: { $ne: "deleted" },
        },
        Product
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new Product(payload)
          .save()
          .then((result) => {
            logController.createLog({
              createdAt: dateISOString,
              title: "Create Product",
              note: "",
              type: "Product",
              from: result._id,
              by: userByToken._id,
              data: result,
            });
            resolve({
              error: false,
              data: result,
              message: successMessages.Product_CREATED_SUCCESS,
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

  getProducts: (req) => {
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
        .paginate(pageKey, pageSize, pipeline, Product)
        .then((products) => {
          Product.populate(products.data, { path: "businessId categoryId" })
            .then((data) => {
              resolve({
                error: false,
                data: data,
                count: products.count,
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

  updateProduct: async (req) => {
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let body = req.body;

    let nameIsExist = await dataController.isExist(
      { businessId: body.data.businessId, name: body.data.name },
      Product
    );

    if (nameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.NAME_ALREADY_EXISTS,
      });
    }

    if (!body.ProductId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    body.data["updatedAt"] = dateISOString;
    body.data["changedBy"] = userByToken._id;

    return new Promise((resolve, reject) => {
      Product.findByIdAndUpdate(body.ProductId, body.data, { new: true })
        .then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            title: "Update Product",
            note: body.note ? body.note : "",
            type: "Product",
            from: body.ProductId,
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
