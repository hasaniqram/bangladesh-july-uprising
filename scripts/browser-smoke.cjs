const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: /The Monsoon Uprising/i }).waitFor({ timeout: 30000 });
    await page.getByRole('heading', { name: /Division-Wise Impact Map/i }).waitFor();
    await page.locator('.rsm-geography').first().waitFor({ timeout: 120000 });
    const regionCount = await page.locator('.rsm-geography').count();
    if (regionCount < 8) throw Error('Expected interactive geographic regions; found ' + regionCount);

    await page.getByRole('button', { name: /Table/i }).click();
    await page.getByRole('heading', { name: /Division Data Table/i }).waitFor();
    await page.getByPlaceholder('Search divisions...').fill('Dhaka');
    await page.getByRole('cell', { name: 'Dhaka', exact: true }).waitFor();
    await page.getByPlaceholder('Search divisions...').fill('');

    await page.getByRole('button', { name: /Map/i }).click();
    await page.locator('.rsm-geography').first().waitFor({ timeout: 30000 });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('heading', { name: /The Monsoon Uprising/i }).waitFor();

    if (errors.length) throw Error('Browser exceptions: ' + errors.join(' | '));
    process.stdout.write('Browser smoke test passed: map (' + regionCount + ' regions), table, search, return to map, mobile viewport.\n');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
