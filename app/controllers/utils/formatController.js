module.exports = {
  currencyTransform: (value) => {
    return `${value.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")}`;
  },

  convertToLocaleISOString: (date, type) => {
    if (type !== "start" && type !== "end") {
      throw new Error('Parameter "type" harus "start" atau "end"');
    }

    // Format bagian tanggal (tanpa timezone) dari input date
    const [year, month, day] = date.slice(0, 10).split("-");

    // Menentukan waktu berdasarkan type
    const time = type === "start" ? "00:00:00.000" : "23:59:59.999";

    return `${year}-${month}-${day}T${time}`;
  },

  convertToLocaleISOStringNextDay: (date, type) => {
    if (type !== "start" && type !== "end") {
      throw new Error('Parameter "type" harus "start" atau "end"');
    }

    // Parse tanggal input
    const inputDate = new Date(date);

    // Maju 1 hari
    inputDate.setDate(inputDate.getDate() + 1);

    // Format bagian tanggal (tanpa timezone) dari input date
    const [year, month, day] = [
      inputDate.getFullYear(),
      String(inputDate.getMonth() + 1).padStart(2, "0"),
      String(inputDate.getDate()).padStart(2, "0"),
    ];

    // Menentukan waktu berdasarkan type
    const time = type === "start" ? "00:00:00.000" : "23:59:59.999";

    return `${year}-${month}-${day}T${time}`;
  },

  convertToLocaleISOStringPreviousDay: (date, type) => {
    if (type !== "start" && type !== "end") {
      throw new Error('Parameter "type" harus "start" atau "end"');
    }

    // Parse tanggal input
    const inputDate = new Date(date);

    // Mundur 1 hari
    inputDate.setDate(inputDate.getDate() - 1);

    // Format bagian tanggal (tanpa timezone) dari input date
    const [year, month, day] = [
      inputDate.getFullYear(),
      String(inputDate.getMonth() + 1).padStart(2, "0"),
      String(inputDate.getDate()).padStart(2, "0"),
    ];

    // Menentukan waktu berdasarkan type
    const time = type === "start" ? "00:00:00.000" : "23:59:59.999";

    return `${year}-${month}-${day}T${time}`;
  },

  convertToDateDDMMYYYY(dateISOString) {
    const date = new Date(dateISOString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() returns 0-11
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  getPreviousDay(dateISOString) {
    const date = new Date(dateISOString);
    date.setDate(date.getDate() - 1);
    return this.convertToDateDDMMYYYY(date.toISOString());
  },

  getNextDay(dateISOString) {
    const date = new Date(dateISOString);
    date.setDate(date.getDate() + 1);
    return this.convertToDateDDMMYYYY(date.toISOString());
  },
};
