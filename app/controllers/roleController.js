// controllers
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
        body.businessIds &&
        body.businessIds?.length > 0 &&
        body.title
      );
    };

    let payload = isBodyValid()
      ? {
          businessIds: body.businessIds,
          access: body.access,
          title: body.title,
        }
      : {
          error: true,
          message: errorMessages.INVALID_DATA,
        };

    if (isBodyValid()) {
      return new Promise((resolve, reject) => {
        new Role(payload).save().then((result) => {
          logController.createLog({
            createdAt: dateISOString,
            name: "Create Role",
            note: "",
            type: "role",
            from: result._id,
            by: userByToken._id,
            data: result,
          });

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
            logController.createLog({
              createdAt: dateISOString,
              name: "Update Role",
              note: body.note ? body.note : "",
              type: "role",
              from: body.roleId,
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
    }
  },
};
