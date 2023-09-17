const { v4: uuidv4 } = require("uuid");

module.exports = {
  generateAccessToken: () => {
    return uuidv4();
  },

  generateTokenExpirateAt: function (daysBeforeExpiration) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysBeforeExpiration);
    const isoDateString = currentDate.toISOString();
    return isoDateString;
  },
};
