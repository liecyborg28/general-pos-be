// controllers
const dataController = require("./utils/dataController");
const logController = require("./logController");
const pageController = require("./utils/pageController");

// models
const Role = require("../models/roleModel");
const User = require("../models/userModel");

// repositories
const errorMessages = require("../repository/messages/errorMessages");
const successMessages = require("../repository/messages/successMessages");

module.exports = {
  create: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    let isBodyValid = () => {
      return (
        body.access &&
        body.access.length > 0 &&
        body.businessId &&
        body.name &&
        body.status
      );
    };

    let payload = isBodyValid()
      ? {
          access: body.access,
          businessId: body.businessId,
          name: body.name,
          status: body.status,
          createdAt: dateISOString,
          updatedAt: dateISOString,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      let nameIsExist = await dataController.isExist(
        {
          businessId: body.businessId,
          status: { $ne: "deleted" },
          name: body.name,
        },
        Role
      );

      if (nameIsExist) {
        return Promise.reject({
          error: true,
          message: errorMessages.NAME_ALREADY_EXISTS,
        });
      }

      return new Promise((resolve) => {
        new Role(payload).save().then((result) => {
          // logController.create({
          //   by: userByToken._id,
          //   data: result,
          //   from: result._id,
          //   note: body.note ? body.note : null,
          //   title: "Create Role",
          //   type: "role",
          //   // timestamp
          //   createdAt: dateISOString,
          // });

          resolve({
            error: false,
            data: result,
            message: successMessages.ROLE_CREATED_SUCCESS,
          });
        });
      });
    } else {
      return Promise.reject(payload);
    }
  },

  get: (req) => {
    let pageKey = req.query.pageKey ? req.query.pageKey : 1;
    let pageSize = req.query.pageSize ? req.query.pageSize : null;

    isNotEveryQueryNull = () => {
      return req.query.businessId || req.query.name;
    };

    return new Promise((resolve, reject) => {
      let pipeline = isNotEveryQueryNull()
        ? {
            status: { $ne: "deleted" },
            $or: [
              {
                businessId: req.query.businessId ? req.query.businessId : null,
              },
              {
                name: req.query.name
                  ? { $regex: req.query.name, $options: "i" }
                  : null,
              },
            ],
          }
        : { status: { $ne: "deleted" } };

      pageController
        .paginate(pageKey, pageSize, pipeline, Role)
        .then((roles) => {
          resolve({
            error: false,
            data: roles.data,
            count: roles.count,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  update: async (req) => {
    let body = req.body;
    let dateISOString = new Date().toISOString();
    const bearerHeader = req.headers["authorization"];
    const bearerToken = bearerHeader.split(" ")[1];

    let userByToken = await User.findOne({
      "auth.accessToken": bearerToken,
    });

    if (!body.roleId) {
      return Promise.reject({
        error: true,
        message: errorMessages.INVALID_DATA,
      });
    } else {
      body.data["updatedAt"] = dateISOString;

      return new Promise((resolve, reject) => {
        Role.findByIdAndUpdate(body.roleId, body.data, { new: true })
          .then((result) => {
            // logController.create({
            //   by: userByToken._id,
            //   data: result,
            //   from: result._id,
            //   note: body.note ? body.note : null,
            //   title: "Update Role",
            //   type: "role",
            //   // timestamp
            //   createdAt: dateISOString,
            // });
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
