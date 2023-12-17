import { Builder, By, until } from "selenium-webdriver";
import puppeteer from "puppeteer";
import PDFMerger from "pdf-merger-js";
import { promises as fsPromises } from "fs";
import path from "path";
const tempdirectory = "temp";
const captchaSelector = "captcha-container";

var merger = new PDFMerger();

async function test() {
  const browser = await puppeteer.launch({ headless: false });
  try {
    const page = await browser.newPage();
    for (var i = 1; ; i++) {
      await scrapPage(i, page);
    }
  } finally {
  }
}

async function scrapPage(pageNo, page) {
  await page.goto("https://www.examtopics.com/exams/amazon/*/view/" + pageNo, {
    waitUntil: "networkidle2",
  });

  const captchBox = await page.$(`.${captchaSelector}`);
  if (captchBox) {
    console.log("captcha found , solve it bro");
    await waitForCaptcha(page);
  }
  const elementClassName = "reveal-solution";
  await page.waitForSelector(`.${elementClassName}`);
  const elements = await page.$$(`.${elementClassName}`);

  for (const element of elements) {
    await element.click();
  }
  const elementsToRemove = [
    ".full-width-header",
    ".alert-success",
    ".alert-info",
    ".rs-footer",
  ];
  // Remove specific elements from the page
  await Promise.all(
    elementsToRemove.map((selector) =>
      page.$$eval(selector, (elements) => elements.forEach((el) => el.remove()))
    )
  );
  if (!fs.existsSync(tempdirectory)) {
    fs.mkdirSync(tempdirectory);
  }
  await page.pdf({
    path: `temp/page${pageNo}.pdf`,
    format: "A4",
  });
}

async function waitForCaptcha(page) {
  let timeout = 0;
  const elementsToRemove = [".contrib-new", ".rs-header-top"];
  await Promise.all(
    elementsToRemove.map((selector) =>
      page.$$eval(selector, (elements) => elements.forEach((el) => el.remove()))
    )
  );
  while (timeout < 70000) {
    const captchBox = await page.$(`.${captchaSelector}`);
    if (!captchBox) {
      console.log("captcha solved");
      break;
    }
    await page.waitForTimeout(5000);
    timeout += 5000;
  }
}
async function mergePdfs(folderPath) {
  try {
    const files = await fsPromises.readdir(folderPath);
    await Promise.all(
      files
        .filter((file) => path.extname(file).toLowerCase() === ".pdf")
        .map((file) => path.basename(file))
        .map(async (file) => await merger.add(`temp/${file}`))
    );
    await merger.save("merged.pdf");
  } catch (error) {
    throw error;
  }
}

try {
  test();
} finally {
  mergePdfs("temp");
}
