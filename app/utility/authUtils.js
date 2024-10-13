const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

function generateHash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

module.exports = {
  generateAccessToken: () => {
    let uuid = uuidv4();
    let timestamp = Date.now().toString();
    let combined = `${uuid}-${timestamp}`;
    return generateHash(combined);
  },

  generateExpirationDate: function (daysBeforeExpiration) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + daysBeforeExpiration);
    const isoDateString = currentDate.toISOString();
    return isoDateString;
  },
};
