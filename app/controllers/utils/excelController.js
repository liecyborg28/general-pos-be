const ExcelJS = require("exceljs");

module.exports = {
  generate: async function (data) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.book.creator;
    workbook.created = data.book.created;
    workbook.title = data.book.name;

    data.book.sheets.forEach((sheetData) => {
      const sheet = workbook.addWorksheet(sheetData.name);

      // Add header row with merged cells and centered text
      const headerRow = sheet.addRow([sheetData.content.header.name]);
      headerRow.eachCell((cell) => {
        cell.font = {
          bold: sheetData.content.header.fontStyle === "bold",
          italic: sheetData.content.header.fontStyle === "italic",
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: sheetData.content.header.color.background.replace("#", ""),
          },
        };
        cell.font.color = {
          argb: sheetData.content.header.color.text.replace("#", ""),
        };
        cell.alignment = { horizontal: "center", vertical: "middle" }; // Centered text alignment for row 1
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      sheet.mergeCells(
        `A1:${String.fromCharCode(64 + sheetData.content.columns.length)}1`
      );

      // Add column headers with specified styling and alignment
      const columnNames = sheetData.content.columns.map((col) => col.name);
      const columnRow = sheet.addRow(columnNames);
      columnRow.eachCell((cell, colNumber) => {
        const colData = sheetData.content.columns[colNumber - 1];
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: colData.color.background.replace("#", "") },
        };

        // Set font style based on `fontStyle`
        cell.font = {
          color: { argb: colData.color.text.replace("#", "") },
          bold: colData.fontStyle === "bold",
          italic: colData.fontStyle === "italic",
        };

        // Center alignment for column headers (row 2)
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data rows based on the values in each column
      const rowCount = sheetData.content.columns[0].values.length;
      for (let i = 0; i < rowCount; i++) {
        const rowData = sheetData.content.columns.map(
          (column) => column.values[i]
        );
        const row = sheet.addRow(rowData);

        // Apply borders, formatting, alignment, and cell adjustments
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          const colData = sheetData.content.columns[colNumber - 1];

          // Format and align data cells
          if (colData.format === "accounting") {
            cell.numFmt = '"Rp"#,##0.00;[Red]\\-"Rp"#,##0.00';
          }
          cell.alignment = {
            horizontal: colData.align || "left",
            vertical: "middle",
          };
        });
      }

      // Set column widths to fit the longest content
      sheetData.content.columns.forEach((col, colIndex) => {
        const maxLength = Math.max(
          col.name.length,
          ...col.values.map((value) => value.toString().length)
        );

        // Add extra width for accounting format columns
        const extraWidth = col.format === "accounting" ? 10 : 2;
        sheet.getColumn(colIndex + 1).width = maxLength + extraWidth;
      });

      // Apply frozen pane based on 'fixed' property
      const fixedColumns =
        sheetData.content.columns.findIndex((col) => !col.fixed) + 1;
      if (fixedColumns > 1) {
        sheet.views = [{ state: "frozen", xSplit: fixedColumns }];
      }
    });

    // Save workbook to buffer and return it
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },
};
