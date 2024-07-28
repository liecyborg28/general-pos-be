const puppeteer = require("puppeteer");

const config = {
  width: "57mm",
  height: "81mm",
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
};

module.exports = {
  generatePDF: async (html) => {
    const browser = await puppeteer.launch({
      headless: "new",
    });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf(config);
    await browser.close();
    return pdfBuffer;
  },
};
