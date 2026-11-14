// Recortes a 2x del suelo y del cielo de Appa en los tres ánimos (tema claro u oscuro).
// Uso: OUT=dir [TEMA=claro|oscuro] [ANCHO=1440 ALTO=900] node run.js recorte-monitos.cjs
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.env.ANCHO || 1440), H = Number(process.env.ALTO || 900);
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto('http://localhost:5199');
  await page.getByTitle('Cambiar tema').waitFor();
  if ((await page.evaluate(() => document.documentElement.dataset.tema)) !== (process.env.TEMA || 'claro')) await page.getByTitle('Cambiar tema').click();
  await page.getByRole('button', { name: 'Descanso', exact: true }).first().click();
  await page.waitForTimeout(800);
  const boton = page.locator('.reloj__mandos .btn--fuerte');
  const zonas = async (n) => {
    await page.waitForTimeout(1300);
    const cajas = await page.evaluate(() => [...document.querySelectorAll('.mono')].map((m) => { const r = m.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
    const suelo = cajas.filter((c, i) => i < 6).reduce((a, c) => [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[2], c[0] + c[2]), Math.max(a[3], c[1] + c[3])], [1e9, 1e9, 0, 0]);
    const x0 = 0, y0 = suelo[1] - 10;
    await page.screenshot({ path: path.join(OUT, `${n}-suelo.png`), clip: { x: x0, y: y0, width: 1172 > W ? W : Math.min(1172, W - 268), height: H - y0 } });
    await page.screenshot({ path: path.join(OUT, `${n}-appa.png`), clip: { x: 0, y: 52, width: Math.min(1172, W - 268), height: 90 } });
  };
  await zonas('siesta');
  await boton.click(); await page.clock?.runFor?.(0).catch(() => {});
  await zonas('estudia');
  await page.getByRole('button', { name: 'Saltar' }).click();
  if ((await boton.textContent()) !== 'Pausar') await boton.click();
  await zonas('recreo');
  console.log('errores:', JSON.stringify(errs));
  await b.close();
})();
