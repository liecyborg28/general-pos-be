const puppeteer = require("puppeteer");
const fs = require("fs");
const { exec } = require("child_process");
const pdfPoppler = require("pdf-poppler");
const path = require("path");
const sharp = require("sharp"); // Pastikan sharp terpasang
const errorMessages = require("../../repository/messages/errorMessages");
const successMessages = require("../../repository/messages/successMessages");

// Tentukan resolusi DPI sesuai dengan printer thermal Anda
const DPI = 203; // Misalnya, 384 DPI untuk printer thermal

const config = {
  width: "88mm", // Lebar kertas untuk PDF
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

  // Tentukan path gambar hasil konversi
  const imagePath = outputPath + "-1.png";
  const resizedImagePath = path.join(outputDir, "output_resized.png");

  // Ukuran kertas printer dalam piksel
  const widthPx = (88 * DPI) / 25.4; // Lebar kertas 88mm

  // Perbesar gambar menjadi dua kali lipat ukuran asli dengan pengaturan sharpen untuk ketajaman
  await sharp(imagePath)
    .resize({
      width: Math.round(widthPx * 2), // Sesuaikan dengan lebar baru
      height: Math.round((widthPx * 2 * 162) / 116), // Sesuaikan dengan tinggi baru proporsional
      fit: "inside",
    })
    .sharpen()
    .toFile(resizedImagePath);

  return resizedImagePath;
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
  printFromBuffer: async (pdfBuffer) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Simpan PDF buffer ke file sementara
        const pdfPath = path.join(__dirname, "tempPrintFile.pdf");
        fs.writeFileSync(pdfPath, pdfBuffer);

        // Konversi PDF menjadi gambar menggunakan pdf-poppler
        const outputImagePath = await pdfToImage(pdfPath, __dirname);

        // Hapus file PDF sementara
        fs.unlinkSync(pdfPath);

        // Cetak gambar menggunakan MS Paint
        exec(
          `mspaint /pt "${outputImagePath}" "RONGTA 58mm Series Printer"`,
          (error) => {
            if (error) {
              // fs.unlinkSync(outputImagePath); // Hapus gambar sementara jika terjadi kesalahan
              return reject(errorMessages.PRINTING_FAILED);
            }
            // fs.unlinkSync(outputImagePath); // Hapus gambar sementara
            resolve(successMessages.PRINTING_SUCCESSFULLY);
          }
        );
      } catch (error) {
        console.error("Kesalahan saat mencetak:", error);
        reject(errorMessages.PRINTING_FAILED);
      }
    });
  },

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
        // Menghapus height agar menyesuaikan dengan konten
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
