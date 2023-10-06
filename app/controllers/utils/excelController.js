module.exports = {
  convertExcelToObject: (startColumn, endColumn, worksheet) => {
    const data = [];

    let currentRow = 3; // Mulai dari baris ke-3

    // Loop untuk mengambil data dari baris 3 hingga akhir, berhenti saat menemukan baris kosong
    while (true) {
      const rowData = {};
      let isEmpty = true;

      for (let colNumber = startColumn; colNumber <= endColumn; colNumber++) {
        const cellValue = worksheet.getRow(currentRow).getCell(colNumber).value;
        const columnHeader = worksheet
          .getRow(2)
          .getCell(colNumber)
          .value.toLowerCase()
          .trim();

        if (cellValue !== null && cellValue !== undefined) {
          rowData[columnHeader] = cellValue;
          isEmpty = false;
        }
      }

      if (isEmpty) {
        // Baris kosong ditemukan, berhenti loop
        break;
      }

      data.push(rowData);
      currentRow++;
    }

    return data;
  },
};
