import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, 'public', 'projects');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const sites = [
  { url: 'https://merechauffer-ddc.vercel.app/', filename: 'laecovida.jpg' },
  { url: 'https://enrgestion.vercel.app/', filename: 'enrgestion.jpg' },
  { url: 'https://adminmechauffer.vercel.app/', filename: 'admin.jpg' },
  { url: 'https://merechauffer-ddc.vercel.app/boutique', filename: 'boutique.jpg' }
];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  for (const site of sites) {
    console.log(`Navigating to ${site.url}...`);
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      
      console.log(`Waiting for network idle on ${site.url}...`);
      await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      console.log(`Waiting an extra 3 seconds for animations/lazy loads...`);
      await new Promise(r => setTimeout(r, 3000));
      
      const outPath = path.join(outDir, site.filename);
      console.log(`Saving screenshot to ${outPath}...`);
      
      await page.screenshot({ 
          path: outPath, 
          fullPage: true,
          type: 'jpeg',
          quality: 85
      });
      console.log(`Successfully saved ${site.filename}`);
      await page.close();
    } catch (e) {
      console.error(`Failed to screenshot ${site.url}:`, e.message);
    }
  }
  await browser.close();
  console.log('Capture completely finished!');
})();
