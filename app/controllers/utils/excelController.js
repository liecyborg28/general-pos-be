const ExcelJS = require("exceljs");
const successMessages = require("../../repository/messages/successMessages");
const errorMessages = require("../../repository/messages/errorMessages");
const fs = require("fs");

module.exports = {
  generateExcelTemplate: (properties) => {
    const { title, worksheet, workbook, data } = properties;

    const workbookObj = new ExcelJS.Workbook();
    const worksheetObj = workbookObj.addWorksheet(worksheet);

    const headerValues = Object.keys(data[0]);

    // Menetapkan lebar kolom berdasarkan panjang isi data
    headerValues.forEach((header, index) => {
      const column = worksheetObj.getColumn(index + 1);
      const columnLength = Math.max(
        header.length,
        ...data.map((row) => (row[header] || "").toString().length)
      );
      column.width = columnLength + 2; // Tambahkan sedikit padding
    });

    // Masukkan judul pada baris 1
    const titleRow = worksheetObj.addRow([title]);

    // Gaya latar belakang kuning untuk sel judul
    titleRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
    });

    // Gabungkan dan atur posisi tengah pada sel baris 1 (title)
    worksheetObj.mergeCells(1, 1, 1, headerValues.length);
    worksheetObj.getCell(1, 1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // Masukkan header pada baris 2
    const headerRow = worksheetObj.addRow(headerValues);

    // Gaya latar belakang kuning untuk sel header
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
    });

    // Masukkan data
    data.forEach((item, index) => {
      const dataRow = worksheetObj.addRow(Object.values(item));
    });

    // Tambahkan border ke seluruh sel kecuali bagian bawah pada baris terakhir yang terisi data
    worksheetObj.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (rowNumber < worksheetObj.rowCount) {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        } else {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
            bottom: { style: "none" }, // Hapus border bawah pada baris terakhir
          };
        }
      });
    });

    const timestamp = Date.now();
    const fileName = `${workbook}_${timestamp}.xlsx`;

    return new Promise((resolve, reject) => {
      workbookObj.xlsx
        .writeBuffer()
        .then((buffer) => {
          // fs.writeFileSync(fileName, buffer, "binary");
          resolve({
            error: false,
            message: successMessages.FILE_CREATED_SUCCESS,
            data: {
              excel: {
                name: fileName,
                buffer,
              },
            },
          });
        })
        .catch((err) => {
          reject({
            error: true,
            message: err,
          });
        });
    });
  },

  convertExcelToObject: (startColumn, endColumn, worksheet) => {
    const data = [];

    let currentRow = 3;

    while (true) {
      const rowData = {};
      let isEmpty = true;

      for (let colNumber = startColumn; colNumber <= endColumn; colNumber++) {
        const cellValue = worksheet.getRow(currentRow).getCell(colNumber).value;
        const columnHeader = worksheet
          .getRow(2)
          .getCell(colNumber)
          .value.trim();

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
