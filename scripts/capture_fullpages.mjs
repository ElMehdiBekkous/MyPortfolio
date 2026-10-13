import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '..', 'public', 'projects');

async function scrollPage(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 350;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 60);
    });
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1200));
}

(async () => {
  console.log('Launching browser for full page captures...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--host-resolver-rules=MAP www.arropatucasa.es 76.76.21.21, MAP arropatucasa.es 76.76.21.21'
    ]
  });

  // 1. Maktabt.com
  try {
    console.log('Capturing full page for Maktabt.com...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto('https://www.maktabt.com/', { waitUntil: 'networkidle2', timeout: 35000 });
    await scrollPage(page);
    const maktabtOut = path.join(outDir, 'maktabt.jpg');
    await page.screenshot({
      path: maktabtOut,
      fullPage: true,
      type: 'jpeg',
      quality: 85
    });
    console.log('Saved maktabt.jpg successfully!');
    await page.close();
  } catch (err) {
    console.error('Error capturing Maktabt:', err);
  }

  // 2. ArropaTuCasa
  try {
    console.log('Capturing full page for ArropaTuCasa...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem('arropatucasa-theme', 'light');
      } catch (e) {}
    });
    await page.goto('https://www.arropatucasa.es/', { waitUntil: 'networkidle2', timeout: 35000 });
    await page.addStyleTag({
      content: `
        aside[aria-labelledby="cookie-banner-title"],
        aside[role="dialog"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `
    });
    await scrollPage(page);
    const arroOut = path.join(outDir, 'arropatucasa.jpg');
    await page.screenshot({
      path: arroOut,
      fullPage: true,
      type: 'jpeg',
      quality: 85
    });
    console.log('Saved arropatucasa.jpg successfully!');
    await page.close();
  } catch (err) {
    console.error('Error capturing ArropaTuCasa:', err);
  }

  await browser.close();
  console.log('All full-page captures completed!');
})();
