const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH });
  const page = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 })).newPage();
  await page.goto('http://localhost:5199');
  await page.getByRole('button', { name: 'Descanso', exact: true }).first().click();
  await page.waitForTimeout(1800);
  await page.addStyleTag({ content: '.mono__z{animation:none !important;opacity:.8 !important}' });
  const r = await page.evaluate(() => { const o = {}; document.querySelectorAll('.mono').forEach((m) => { const n = [...m.classList].find((k) => k.startsWith('mono--')); const b = m.getBoundingClientRect(); o[n] = [b.x, b.y, b.width, b.height]; }); return o; });
  const p = r['mono--perrito'], c = r['mono--conejito'];
  await page.screenshot({ path: '.ui-pipeline/capturas/lote1/zeta-perrito.png', clip: { x: p[0], y: p[1] - 6, width: 120, height: p[3] + 6 } });
  await page.screenshot({ path: '.ui-pipeline/capturas/lote1/zeta-conejito.png', clip: { x: c[0], y: c[1] - 6, width: 120, height: c[3] + 6 } });
  await b.close();
})();
