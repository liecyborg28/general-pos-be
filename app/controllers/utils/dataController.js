module.exports = {
  isCollectionEmpty: (model) => {
    return model
      .countDocuments()
      .then((count) => count === 0)
      .catch((err) => {
        console.log(err);
        return false;
      });
  },

  isExist: async (query, model) => {
    return new Promise((resolve, reject) => {
      model
        .find(query)
        .then((data) => {
          resolve(data.length > 0 ? true : false);
        })
        .catch(() => {
          reject(false);
        });
    });
  },
};
