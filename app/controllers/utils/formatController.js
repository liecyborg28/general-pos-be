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

    // Menambahkan offset dari date input
    const offset = date.slice(19);

    // Menghasilkan string ISO dengan offset yang sudah didapat
    // return `${year}-${month}-${day}T${time}${offset}`;
    return `${year}-${month}-${day}T${time}`;
  },
};
