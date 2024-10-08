const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

function generateHash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

module.exports = {
  generateAccessToken: () => {
    const uuid = uuidv4();
    const timestamp = Date.now().toString();
    const combined = `${uuid}-${timestamp}`;
    return generateHash(combined);
  },

  generateExpirationDate: function (daysBeforeExpiration) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysBeforeExpiration);
    const isoDateString = currentDate.toISOString();
    return isoDateString;
  },
};
