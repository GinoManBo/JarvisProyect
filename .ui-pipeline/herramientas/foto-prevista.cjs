// Uso: OUT=ruta.png [QUERY='animal=conejito&w=260'] node run.js foto-prevista.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH });
  const p = await b.newPage({ viewport: { width: Number(process.env.VW || 1000), height: 800 }, deviceScaleFactor: Number(process.env.ESC || 1.5) });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:5199/.ui-pipeline/herramientas/prevista-monitos.html?' + (process.env.QUERY || ''));
  await p.waitForSelector('.celda');
  await p.addStyleTag({ content: '.mono,.mono *{animation-play-state:paused !important;animation-delay:-0.001s !important}' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: process.env.OUT, fullPage: true });
  console.log('errores:', JSON.stringify(errs));
  await b.close();
})();
