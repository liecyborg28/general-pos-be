const puppeteer = require("puppeteer");

const config = {
  width: "57mm",
  height: "81mm",
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  timeout: 60000, // memperpanjang batas waktu menjadi 60 detik
};

module.exports = {
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
        // format: "A4",
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
