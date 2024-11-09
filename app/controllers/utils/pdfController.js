const PDFDocument = require("pdfkit");

module.exports = {
  generate: async function (data) {
    const doc = new PDFDocument({ autoFirstPage: false });

    // Add a page to the PDF document
    doc.addPage();

    // Set the title and creator from the provided data
    doc.fontSize(16).text(data.book.name, {
      align: "center",
    });
    doc.moveDown();

    // Loop through each sheet
    data.book.sheets.forEach((sheetData) => {
      doc.fontSize(12).text(sheetData.name, {
        align: "center",
      });
      doc.moveDown();

      // Define table columns and alignment based on the provided data
      const columnNames = sheetData.content.columns.map((col) => col.name);
      const columnWidths = sheetData.content.columns.map((col) => {
        const maxLength = Math.max(
          col.name.length,
          ...col.values.map((value) => value.toString().length)
        );
        return maxLength * 7; // Adjust width multiplier for better spacing
      });

      // Header Row (Bold, Centered)
      columnNames.forEach((colName, index) => {
        doc.font("Helvetica-Bold").text(colName, {
          continued: true,
          width: columnWidths[index],
          align: "center",
        });
      });
      doc.moveDown();

      // Add separator line after header
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.x + columnWidths.reduce((a, b) => a + b, 0), doc.y)
        .stroke();

      // Add Data Rows
      sheetData.content.columns[0].values.forEach((_, rowIndex) => {
        sheetData.content.columns.forEach((col, colIndex) => {
          let value = col.values[rowIndex];

          // Format accounting values with 'Rp' symbol
          if (col.format === "accounting") {
            value = `Rp ${value
              .toFixed(2)
              .replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
          }

          doc.font("Helvetica").text(value.toString(), {
            continued: true,
            width: columnWidths[colIndex],
            align: col.align || "left",
          });
        });
        doc.moveDown();
      });

      // Add a separator line between sheets
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.x + columnWidths.reduce((a, b) => a + b, 0), doc.y)
        .stroke();
      doc.moveDown();
    });

    // Output the PDF document to a buffer
    const buffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

    return buffer;
  },
};
