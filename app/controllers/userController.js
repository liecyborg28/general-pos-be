const User = require("../models/userModel");

const UserController = {
  createUser: (userBody) => {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : {
          error: true,
          message: `Invalid data, body requires (userBody.type && userBody.gender && userBody.name && userBody.phonenumber && userBody.username &&userBody.password && userBody.businessId && userBody.outletId && userBody.access)`,
        };

    if (isBodyValid()) {
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

  getUsers: () => {
    return new Promise((resolve, reject) => {
      User.find()
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
};

// newUser
//   .save()
//   .then(() => console.log("User created"))
//   .catch((err) => console.log(err));

// // Read all users
// User.find()
//   .then((users) => console.log(users))
//   .catch((err) => console.log(err));

// // Update a user
// User.findOneAndUpdate({ name: "John Doe" }, { name: "Jane Doe" })
//   .then(() => console.log("User updated"))
//   .catch((err) => console.log(err));

// // Delete a user
// User.deleteOne({ name: "Jane Doe" })
//   .then(() => console.log("User deleted"))
//   .catch((err) => console.log(err));

module.exports = UserController;
