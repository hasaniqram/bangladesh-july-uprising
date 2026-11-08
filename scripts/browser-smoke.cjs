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
    await page.getByRole('heading', { name: /Historical evidence and data limitations/i }).waitFor();
    await page.getByText(/Unverified regional figures:/i).waitFor();
    await page.getByText(/Up to 1,400/i).waitFor();
    await page.getByTitle('Timeline').click();
    await page.getByText('Muhammad Yunus sworn in as Chief Adviser').waitFor();
    const timelinePanel = page.locator('.timeline-panel');
    const referenced = timelinePanel.getByRole('link', { name: /Source: / });
    if ((await referenced.count()) < 8) throw Error('Historical event source links missing');
    if ((await timelinePanel.getByText(/casualties/i).count()) > 0) {
      throw Error('Unverified daily casualty totals exposed in sourced timeline');
    }
    await page.getByTitle('Timeline').click();
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

    // Map fix regression: a division selector and a document-flow detail panel
    // must work without relying on pointer coordinates.
    const mapPicker = page.getByLabel('Select division');
    await mapPicker.selectOption('dhaka');
    await page.locator('.map-region-details').getByRole('heading', { name: /Dhaka/i }).waitFor();
    const detailStyle = await page.locator('.map-region-details').evaluate(element => getComputedStyle(element).position);
    if (detailStyle === 'absolute') throw Error('Region details should not be floating over the map');
    await mapPicker.selectOption('');
    if (await page.locator('.map-region-details').count()) throw Error('All divisions should dismiss pinned details');

    const keyboardRegions = page.locator('.rsm-geography[tabindex="0"][role="button"]');
    if (await keyboardRegions.count() < 8) throw Error('Keyboard-accessible map regions missing');
    await keyboardRegions.first().focus();
    await page.keyboard.press('Enter');
    if ((await keyboardRegions.first().getAttribute('aria-pressed')) !== 'true') {
      throw Error('Keyboard activation did not select a geographic region');
    }
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Switch to Bengali' }).click();
    await page.getByRole('heading', { name: 'বাংলাদেশের জুলাই ২০২৪-এর গণঅভ্যুত্থান' }).waitFor();
    if (await page.locator('html').getAttribute('lang') !== 'bn') {
      throw Error('Bengali document language was not applied');
    }
    await page.getByRole('heading', { name: 'ঐতিহাসিক তথ্যপ্রমাণ ও উপাত্তের সীমাবদ্ধতা' }).waitFor();
    await page.getByRole('button', { name: 'ঘটনাপঞ্জি', exact: true }).click();
    await page.getByText('প্রধান উপদেষ্টা হিসেবে মুহাম্মদ ইউনূসের শপথ').waitFor();
    await page.getByRole('button', { name: 'ঘটনাপঞ্জি', exact: true }).click();
    await page.getByRole('button', { name: 'সারণি', exact: true }).click();
    await page.getByRole('heading', { name: 'বিভাগভিত্তিক তথ্যসারণি' }).waitFor();
    await page.getByRole('button', { name: 'Switch to English' }).click();
    if (await page.locator('html').getAttribute('lang') !== 'en') {
      throw Error('English document language was not restored');
    }
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await page.locator('.rsm-geography').first().waitFor();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Select division').selectOption('rangpur');
    await page.locator('.map-region-details').getByRole('heading', { name: /Rangpur/i }).waitFor();
    const mapBounds = await page.locator('.memorial-map-svg').boundingBox();
    if (!mapBounds || mapBounds.width > 390 || mapBounds.width < 150) {
      throw Error('Mobile SVG width is not responsive: ' + JSON.stringify(mapBounds));
    }
    const panelBounds = await page.locator('.map-region-details').boundingBox();
    if (!panelBounds || panelBounds.x < 0 || panelBounds.x + panelBounds.width > 395) {
      throw Error('Region details overflow the mobile viewport: ' + JSON.stringify(panelBounds));
    }
    await page.getByLabel('Select division').selectOption('');
    await page.getByRole('heading', { name: /The Monsoon Uprising/i }).waitFor();

    if (errors.length) throw Error('Browser exceptions: ' + errors.join(' | '));
    process.stdout.write('Browser smoke test passed: map (' + regionCount + ' regions), table, search, return to map, mobile viewport.\n');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
