const ExcelJS = require("exceljs");
const fs = require("fs");

// repositories
const errorMessages = require("../../repository/messages/errorMessages");
const successMessages = require("../../repository/messages/successMessages");

module.exports = {
  generateExcel: async function (data) {
    try {
      const { book } = data;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = book.creator || "Default Creator";
      workbook.created = book.created || new Date();

      book.sheets.forEach((sheetData) => {
        const worksheet = workbook.addWorksheet(sheetData.name);

        // Set up the header
        const headerRow = worksheet.addRow([sheetData.content.header.name]);
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: sheetData.content.header.color.background.replace("#", ""),
            },
          };
          cell.font = {
            bold: sheetData.content.header.fontWeight === "bold",
            color: {
              argb: sheetData.content.header.color.text.replace("#", ""),
            },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });

        // Set up columns with specified name, color, and format
        const columns = sheetData.content.columns.map((col, index) => {
          if (col.fixed) {
            worksheet.views = [{ state: "frozen", xSplit: index + 1 }];
          }
          return {
            header: col.name,
            key: col.name,
            width: 15,
          };
        });
        worksheet.columns = columns;

        // Add data rows
        sheetData.content.columns.forEach((column, colIndex) => {
          column.values.forEach((value, rowIndex) => {
            let row = worksheet.getRow(rowIndex + 2);
            const cell = row.getCell(colIndex + 1);
            cell.value = value;

            // Format cells
            if (column.format === "accounting") {
              cell.numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
            } else if (column.format === "text") {
              cell.numFmt = "@";
            }

            // Apply style to each cell
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: column.color.background.replace("#", "") },
            };
            cell.font = {
              bold: column.fontWeight === "bold",
              color: { argb: column.color.text.replace("#", "") },
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });

        // Apply border to all cells, including empty ones
        worksheet.eachRow((row, rowIndex) => {
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      });

      const filePath = `./${book.name}.xlsx`;
      await workbook.xlsx.writeFile(filePath);
      console.log(`File saved as ${filePath}`);
    } catch (error) {
      console.error("Error generating Excel file:", error);
    }
  },
};
