const User = require("../models/userModel");
const authController = require("./authController");

async function userDataIsExist(query) {
  return new Promise((resolve, reject) => {
    User.find(query)
      .then((data) => {
        resolve(data.length > 0 ? true : false);
      })
      .catch(() => {
        reject(false);
      });
  });
}

const UserController = {
  createUser: async (userBody) => {
    let isBodyValid = () => {
      return (
        userBody.type &&
        userBody.gender &&
        userBody.name &&
        userBody.phonenumber &&
        userBody.username &&
        userBody.password &&
        userBody.businessId &&
        userBody.outletId &&
        userBody.access
      );
    };

    let payload = isBodyValid()
      ? {
          // required
          type: userBody.type,
          gender: userBody.gender,
          name: userBody.name,
          phonenumber: userBody.phonenumber,
          username: userBody.username,
          password: userBody.password,
          businessId: userBody.businessId,
          outletId: userBody.outletId,
          access: userBody.access,
          // optional
          imageUrl: userBody.imageUrl || "",
          email: userBody.email || "",
          // generate by BE
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          auth: authController.generateAuth(),
        }
      : {
          error: true,
          message: `Invalid data, body requires (userBody.type && userBody.gender && userBody.name && userBody.phonenumber && userBody.username &&userBody.password && userBody.businessId && userBody.outletId && userBody.access)`,
        };

    if (isBodyValid()) {
      let phonenumberIsExist = await userDataIsExist({
        phonenumber: userBody.phonenumber,
      });

      let usernameIsExist = await userDataIsExist({
        username: userBody.username,
      });

      if (phonenumberIsExist) {
        return Promise.reject({
          error: true,
          message: "Phone number already exists",
        });
      }

      if (usernameIsExist) {
        return Promise.reject({
          error: true,
          message: "Username already exists",
        });
      }

      return new Promise((resolve, reject) => {
        new User(payload)
          .save()
          .then(() => {
            resolve({
              error: false,
              message: "User created successfully!",
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
    return new Promise((resolve, reject) => {
      let pipeline = {
        $or: [
          { type: req.query.keyword },
          { name: req.query.keyword },
          { username: req.query.keyword },
          { gender: req.query.keyword },
          { phonenumber: req.query.keyword },
          { type: req.query.type },
          { name: req.query.name },
          { username: req.query.username },
          { gender: req.query.gender },
          { phonenumber: req.query.phonenumber },
        ],
      };
      User.find(pipeline)
        .then((users) => {
          resolve({
            error: false,
            data: users,
          });
        })
        .catch((err) => {
          reject({ error: true, message: err });
        });
    });
  },

  updateUser: (userBody) => {
    if (!userBody.userId) {
      return Promise.reject({
        error: true,
        message: "Invalid data, body requires userId",
      });
    } else {
      return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(userBody.userId, userBody.data, { new: true })
          .then(() => {
            User.findByIdAndUpdate(
              userBody.userId,
              { updatedAt: new Date().toISOString() },
              { new: true }
            )
              .then(() => {
                resolve({
                  error: false,
                  message: "Data has been successfully updated!",
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
    }
  },
};

module.exports = UserController;
