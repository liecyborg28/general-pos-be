const ExcelJS = require("exceljs");
const excelController = require("./utils/excelController");
const User = require("../models/userModel");
const Business = require("../models/businessModel");
const authController = require("./authController");
const dataController = require("./utils/dataController");
const pageController = require("./utils/pageController");
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

const UserController = {
  getBulkUserTemplate: (req) => {
    let type = req.query.type || null;

    if (!type) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    }

    if (type) {
      return new Promise((resolve, reject) => {
        const properties = {
          workbook: `Template_Upload_Daftar_Pengguna`,
          worksheet: "Daftar Pengguna",
          title: "Daftar Pengguna",
          data: [
            {
              no: 1,
              name: "Nama lengkap (wajib)",
              phonenumber: "Nomor HP (Cth: 852xxxxxxxx) (wajib)",
              gender: "Jenis kelamin (pria / wanita) (wajib)",
              username: "username (wajib)",
              password: "password (wajib)",
              email: "Alamat email",
              imageUrl: "URL gambar",
            },
          ],
          hiddenSheets: [
            {
              name: "type",
              value: type,
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
    }
  },

  createBulkUser: (req) => {
    let dateISOString = new Date().toISOString();
    return new Promise((resolve, reject) => {
      try {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx.load(req.file.buffer).then(async () => {
          const worksheet = workbook.getWorksheet(1);

          const { data, hiddenSheets } = excelController.convertExcelToObject(
            2,
            9,
            worksheet
          );

          let existingUsers = [];

          const transformedData = data.map((e) => {
            return {
              name: e.name,
              phonenumber: e.phonenumber,
              gender: e.gender,
              type: hiddenSheets[0].value,
              status: "active",
              username: e.username,
              password: e.password,
              email: e.email ? e.email : "",
              imageUrl: e.imageUrl ? e.imageUrl : "",
              // generate by BE
              createdAt: dateISOString,
              updatedAt: dateISOString,
              auth: authController.generateAuth(),
            };
          });

          const promises = transformedData.map(async (user) => {
            try {
              let existingUser = await dataController.isExist(
                {
                  $or: [
                    { username: user.username },
                    { phonenumber: user.phonenumber },
                  ],
                },
                User
              );

              if (!existingUser) {
                await new User(user).save();
              } else {
                existingUsers.push(user);
              }
            } catch (error) {
              console.log(error);
            }
          });

          await Promise.all(promises);

          if (existingUsers.length < 1) {
            resolve({
              error: false,
              message: successMessages.ALL_DATA_SAVED,
            });
          } else if (existingUsers.length === data.length) {
            reject({
              error: true,
              message: errorMessages.ALL_DATA_NOT_SAVED_BECAUSE_DUPLICATE,
            });
          } else {
            resolve({
              error: false,
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

  registerUser: async (body) => {
    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return body.name && body.phonenumber && body.email && body.password;
    };

    let payload = isBodyValid()
      ? {
          type: "customer",
          status: "active",
          imageUrl: "",
          gender: "",
          name: body.name,
          phonenumber: body.phonenumber,
          email: body.email,
          password: body.password,
          createdAt: dateISOString,
          updatedAt: dateISOString,
          auth: authController.generateAuth(),
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let emailIsExist = await dataController.isExist(
        {
          email: body.email,
          status: { $ne: "deleted" },
        },
        User
      );

      if (emailIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.EMAIL_ALREADY_EXIST,
        });
      }

      return new Promise((resolve, reject) => {
        new User(payload)
          .save()
          .then((result) => {
            pageController
              .paginate(1, null, { status: { $ne: "deleted" } }, Business)
              .then((businesses) => {
                resolve({
                  error: false,
                  userData: result,
                  businessData: businesses.data.map((e) => ({
                    id: e._id,
                    name: e.name,
                    imageUrl: e.imageUrl,
                  })),
                  message: successMessages.USER_CREATED_SUCCESS,
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
    } else {
      return Promise.reject(payload);
    }
  },

  createUser: async (body) => {
    let dateISOString = new Date().toISOString();
    let isBodyValid = () => {
      return (
        body.type &&
        body.gender &&
        body.name &&
        body.phonenumber &&
        body.email &&
        body.password &&
        body.businessIds &&
        body.status &&
        body.outletIds &&
        body.access
      );
    };

    let payload = isBodyValid()
      ? {
          // required
          type: body.type,
          gender: body.gender,
          name: body.name,
          phonenumber: body.phonenumber,
          username: body.username,
          password: body.password,
          businessIds: body.businessIds,
          outletIds: body.outletIds,
          access: body.access,
          status: body.status,
          // optional
          imageUrl: body.imageUrl || "",
          email: body.email || "",
          // generate by BE
          createdAt: dateISOString,
          updatedAt: dateISOString,
          auth: authController.generateAuth(),
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let phonenumberIsExist = await dataController.isExist(
        {
          phonenumber: body.phonenumber,
          status: { $ne: "deleted" },
        },
        User
      );

      let usernameIsExist = await dataController.isExist(
        {
          username: body.username,
          status: { $ne: "deleted" },
        },
        User
      );

      if (phonenumberIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.PHONE_ALREADY_EXISTS,
        });
      }

      if (usernameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.USERNAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve, reject) => {
        new User(payload)
          .save()
          .then((result) => {
            resolve({
              error: false,
              data: result,
              message: successMessages.USER_CREATED_SUCCESS,
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

  getUsers: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : 1000;

    isNotEveryQueryNull = () => {
      return (
        req.query.keyword ||
        req.query.name ||
        req.query.username ||
        req.query.gender ||
        req.query.phonenumber
      );
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            status: { $ne: "deleted" },
            $or: [
              {
                type: req.query.keyword ? { $regex: req.query.keyword } : null,
              },
              {
                name: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                username: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                gender: req.query.keyword
                  ? { $regex: req.query.keyword, $options: "i" }
                  : null,
              },
              {
                phonenumber: req.query.keyword ? req.query.keyword : null,
              },
              {
                type: req.query.type ? { $regex: req.query.type } : null,
              },
              {
                name: req.query.name
                  ? { $regex: req.query.name, $options: "i" }
                  : null,
              },
              {
                username: req.query.username
                  ? { $regex: req.query.username, $options: "i" }
                  : null,
              },
              {
                gender: req.query.gender
                  ? { $regex: req.query.gender, $options: "i" }
                  : null,
              },
              {
                phonenumber: req.query.phonenumber
                  ? req.query.phonenumber
                  : null,
              },
            ],
          }
        : {
            status: { $ne: "deleted" },
          };

      pageController
        .paginate(pageKey, pageSize, pipeline, User)
        .then((users) => {
          resolve({
            error: false,
            data: users.data,
            count: users.count,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  updateUser: async (body) => {
    let dateISOString = new Date().toISOString();
    let phonenumberIsExist = await dataController.isExist(
      {
        phonenumber: body.data.phonenumber,
        _id: { $ne: body.userId },
        status: { $ne: "deleted" },
      },
      User
    );

    let usernameIsExist = await dataController.isExist(
      {
        username: body.data.username,
        _id: { $ne: body.userId },
        status: { $ne: "deleted" },
      },
      User
    );

    if (phonenumberIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.PHONE_ALREADY_EXISTS,
      });
    }

    if (usernameIsExist) {
      return Promise.reject({
        error: true,
        message: errorMessages.USERNAME_ALREADY_EXISTS,
      });
    }

    if (!body.userId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;

      return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(body.userId, body.data, { new: true })
          .then((result) => {
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
    }
  },
};

module.exports = UserController;
