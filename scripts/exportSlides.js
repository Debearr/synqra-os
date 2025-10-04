import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200 });
  await page.goto('http://localhost:3000/chaos-carousel');

  for (let i = 0; i < 3; i++) {
    await page.screenshot({ path: `export/slide-${i + 1}.png` });
    await page.keyboard.press('ArrowRight');
  }

  await browser.close();
})();
