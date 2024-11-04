const PDFDocument = require("pdfkit");

module.exports = {
  generatePDF: function (data) {
    try {
      const { book } = data;
      const doc = new PDFDocument();

      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        // Return or send pdfData as needed
      });

      // Metadata
      doc.info.Title = book.name || "Default PDF Title";
      doc.info.Author = book.creator || "Default Creator";

      // Iterate over sheets in book
      book.sheets.forEach((sheetData) => {
        // Add a title for each sheet
        doc.fontSize(18).fillColor("black").text(sheetData.name, {
          align: "center",
          underline: true,
        });
        doc.moveDown();

        // Set up the header with specified styling
        doc
          .fontSize(14)
          .fillColor(sheetData.content.header.color.text || "black")
          .text(sheetData.content.header.name, { align: "center" });
        doc.moveDown();

        // Set up table columns
        const columns = sheetData.content.columns;
        columns.forEach((column) => {
          doc
            .fontSize(12)
            .fillColor(column.color.text || "black")
            .text(column.name, { continued: true });
          doc.text(" ", 100); // Padding between columns
        });
        doc.moveDown();

        // Add each row of data for columns
        const maxRows = Math.max(...columns.map((col) => col.values.length));
        for (let i = 0; i < maxRows; i++) {
          columns.forEach((column) => {
            let value = column.values[i] || ""; // Fallback if data is missing
            doc
              .fontSize(10)
              .fillColor(column.color.text || "black")
              .text(value.toString(), { continued: true });
            doc.text(" ", 100); // Padding between cells
          });
          doc.moveDown();
        }

        // Add page break if there are multiple sheets
        if (book.sheets.indexOf(sheetData) < book.sheets.length - 1) {
          doc.addPage();
        }
      });

      // Finish PDF and return as a buffer
      doc.end();
      return new Promise((resolve) => {
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
      });
    } catch (error) {
      console.error("Error generating PDF file:", error);
      throw error;
    }
  },
};
