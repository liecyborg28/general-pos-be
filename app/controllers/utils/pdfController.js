// Import dependencies
const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");

class PdfController {
  // Fungsi untuk mengonversi Excel buffer ke HTML
  async convertExcelToHtml(excelBuffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer);

    // Template HTML dasar
    let html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        td { text-align: center; } /* Default text-align center for all rows */
        .header-row { background-color: #f2f2f2; text-align: center; font-weight: bold; }
        .second-row { background-color: #f2f2f2; text-align: center; font-weight: bold; }
      </style>
    </head>
    <body>
  `;

    // Set untuk menyimpan nilai yang sudah ditampilkan (case-sensitive)
    const displayedData = new Set();

    // Proses setiap sheet dan tambahkan data mulai dari baris kedua (abaikan baris pertama)
    workbook.eachSheet((worksheet, sheetId) => {
      // Ambil baris pertama (header) hanya sekali per sheet
      const firstRow = worksheet.getRow(1);
      const firstColumnValue = firstRow.getCell(1).value;

      // Cek apakah nilai dari baris pertama kolom pertama sudah pernah ditampilkan
      if (firstColumnValue && !displayedData.has(firstColumnValue)) {
        // Ambil hanya nilai pertama dari kolom pertama dan tampilkan hanya sekali per sheet
        html += `
        <table>
          <tr>
            <th colspan="${worksheet.columnCount}" class="header-row">
              ${firstColumnValue || ""}
            </th>
          </tr>
        </table>
        <br/>
      `;

        // Tandai nilai pertama sudah ditampilkan (menyimpan dalam set untuk pengecekan selanjutnya)
        displayedData.add(firstColumnValue); // Menyimpan nilai agar tidak tampil lagi
      }

      // Tambahkan data baris kedua dan seterusnya
      html += "<table>";
      let rowIndex = 0; // Menyimpan indeks baris

      worksheet.eachRow((row, rowNumber) => {
        // Hanya proses baris kedua dan seterusnya (baris pertama sudah ditampilkan)
        if (rowNumber > 1) {
          html += "<tr>";

          row.eachCell((cell, colNumber) => {
            let textAlign = "center"; // Default untuk baris pertama adalah center alignment

            if (rowNumber === 2) {
              // Baris kedua tetap center alignment dan diberi warna latar belakang
              textAlign = "center";
              html += `<td class="second-row" style="text-align: ${textAlign};">${
                cell.value || ""
              }</td>`;
            } else if (rowNumber > 2) {
              // Cek tipe data (numerik atau teks)
              if (typeof cell.value === "number" || !isNaN(cell.value)) {
                textAlign = "right"; // Jika numerik, align ke kanan

                // Format angka dengan pemisah ribuan titik
                cell.value = cell.value.toLocaleString("id-ID"); // Menggunakan format ID (Indonesia) untuk titik sebagai pemisah ribuan
              } else {
                textAlign = "left"; // Jika alfanumerik atau teks, align ke kiri
              }

              html += `<td style="text-align: ${textAlign};">${
                cell.value || ""
              }</td>`;
            }
          });
          html += "</tr>";
        }
      });
      html += "</table><br/>";
    });

    html += "</body></html>";

    return html;
  }

  async convertHtmlToPdfBuffer(html) {
    const browser = await puppeteer.launch({
      // executablePath: "/usr/bin/google-chrome", // Gunakan path yang ditemukan
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Muat HTML di halaman
    await page.setContent(html);

    // Mengonversi halaman ke PDF buffer dengan orientasi landscape
    const pdfBuffer = await page.pdf({
      format: "A3",
      landscape: true, // Mengatur orientasi menjadi landscape
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  }

  // Fungsi untuk menangani request HTTP dan mengembalikan PDF buffer
  async generatePdfFromExcel(excelBuffer) {
    try {
      // Konversi Excel buffer ke HTML
      const html = await this.convertExcelToHtml(excelBuffer);

      // Konversi HTML ke PDF buffer dengan Puppeteer
      const pdfBuffer = await this.convertHtmlToPdfBuffer(html);

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PdfController();
