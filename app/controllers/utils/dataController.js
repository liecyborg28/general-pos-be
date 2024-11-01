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

  populateFieldById: async (model, id) => {
    try {
      const result = await model.findById(id);
      if (!result)
        console.error(
          `Data not found for ID: ${id} in model ${model.modelName}`
        );
      return result;
    } catch (error) {
      console.error(
        `Error populating ${model.modelName} with ID: ${id}`,
        error
      );
      return null;
    }
  },
};
