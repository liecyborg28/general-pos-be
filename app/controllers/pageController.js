module.exports = {
  paginate: async (pageKey, pageSize, query, model) => {
    try {
      const page = parseInt(pageKey);
      const limit = parseInt(pageSize);
      const skip = (page - 1) * limit;
      const count = await model.countDocuments();
      const data = await model.find(query).skip(skip).limit(limit).exec();

      return {
        data,
        pageKey: page,
        pageSize: limit,
        count,
      };
    } catch (error) {
      throw error;
    }
  },
};
