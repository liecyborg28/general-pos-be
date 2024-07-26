const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const { exec } = require("child_process");
const pdfPoppler = require("pdf-poppler");
const path = require("path");

const config = {
  width: "57mm",
  height: "81mm",
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  timeout: 60000, // memperpanjang batas waktu menjadi 60 detik
};

async function saveArrayBufferToFile(arrayBuffer, filePath) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, Buffer.from(arrayBuffer), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function pdfToImage(pdfPath, outputDir) {
  const outputPath = path.join(outputDir, "output");
  let options = {
    format: "png",
    out_dir: outputDir,
    out_prefix: "output",
    page: 1,
  };

  console.log("Konversi PDF ke gambar dengan opsi:", options);

  try {
    await pdfPoppler.convert(pdfPath, options);
    console.log("PDF berhasil dikonversi ke gambar!");
  } catch (error) {
    console.error("Gagal mengonversi PDF:", error);
  }

  return outputPath + "-1.png";
}

function printImage(filePath) {
  // Verifikasi keberadaan file
  if (!fs.existsSync(filePath)) {
    console.error(`File gambar tidak ditemukan: ${filePath}`);
    return;
  }

  const pythonScriptPath = path.join(__dirname, "print_image.py"); // Sesuaikan path jika perlu
  const command = `python "${pythonScriptPath}" "${filePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Gagal mencetak gambar: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Kesalahan: ${stderr}`);
      return;
    }

    console.log(`Berhasil mencetak gambar: ${stdout}`);
  });
}

module.exports = {
  printPdf: async (arrayBuffer) => {
    try {
      const outputDir = path.resolve(__dirname, "output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      const pdfPath = path.join(outputDir, "temp.pdf");
      await saveArrayBufferToFile(arrayBuffer, pdfPath);
      console.log(`PDF berhasil disimpan sementara sebagai ${pdfPath}`);

      const imagePath = await pdfToImage(pdfPath, outputDir);
      console.log(`PDF berhasil dikonversi ke gambar ${imagePath}`);

      if (fs.existsSync(imagePath)) {
        printImage(imagePath);
        console.log(`Mencetak gambar ${imagePath}`);
      } else {
        console.error(`File gambar tidak ditemukan: ${imagePath}`);
      }

      // Hapus file sementara PDF setelah pencetakan selesai
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log(`File sementara PDF dihapus: ${pdfPath}`);
      } else {
        console.error(`File sementara PDF tidak ditemukan: ${pdfPath}`);
      }
    } catch (err) {
      console.error("Gagal mencetak PDF:", err);
    }
  },

  generatePDF: async (html) => {
    try {
      console.log("config", config);
      const browser = await puppeteer.launch({
        headless: true, // Menggunakan true atau false
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // opsi tambahan untuk stabilitas
      });
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: config.timeout,
      }); // menunggu hingga semua sumber daya dimuat
      const pdfBuffer = await page.pdf({
        width: config.width,
        height: config.height,
        margin: config.margin,
        printBackground: true,
        timeout: config.timeout,
      });
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  },
};
