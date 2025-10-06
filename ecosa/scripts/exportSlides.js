import fs from 'fs';
import puppeteer from 'puppeteer';

(async () => {
  fs.mkdirSync('export', { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  // Square by default to match format="square" page usage
  await page.setViewport({ width: 1200, height: 1200 });
  await page.goto('http://localhost:3000/chaos-carousel', { waitUntil: 'networkidle2' });

  await page.waitForTimeout(800);

  for (let i = 0; i < 3; i++) {
    const index = i + 1;
    await page.screenshot({ path: `export/slide-${index}.png` });
    if (i < 2) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const next = buttons.find(b => (b.textContent || '').trim() === 'Next');
        if (next) next.click();
      });
      await page.waitForTimeout(500);
    }
  }

  await browser.close();
})();
