import { Builder, By, until } from "selenium-webdriver";
import puppeteer from "puppeteer";

const captchaSelector = "captcha-container";

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
  console.log(elements);
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
  await page.pdf({
    path: "page1.pdf",
    format: "A4",
  });
}

async function waitForCaptcha(page) {
  let timeout = 0;
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

test();
