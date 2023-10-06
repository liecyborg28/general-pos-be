module.exports = {
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
