// Uso: OUT=<dir> [TEMAS=claro,oscuro] [PIELES=n] [REDUCIDO=1] [ANCHO=1440 ALTO=900]
//   PW_EXECUTABLE_PATH=<chrome-headless-shell> node ~/.claude/skills/playwright-skill/run.js captura-monitos.js
// Captura Descanso en siesta / estudia / recreo por cada piel (adelanta el reloj 15 min con page.clock),
// y vuelca las cajas de cada .mono y de las zonas prohibidas a cajas.json para revisar solapes.
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const URL = process.env.TARGET_URL || 'http://localhost:5199';
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
const PIELES = Number(process.env.PIELES || 6);
const W = Number(process.env.ANCHO || 1440), H = Number(process.env.ALTO || 900);
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH });
  const errores = []; const cajas = {};
  try {
    for (const tema of (process.env.TEMAS || 'claro,oscuro').split(',')) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: process.env.REDUCIDO ? 'reduce' : 'no-preference' });
      const page = await ctx.newPage();
      page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
      page.on('pageerror', (e) => errores.push(String(e)));
      await page.clock.install();
      await page.goto(URL);
      await page.getByTitle('Cambiar tema').waitFor();
      if ((await page.evaluate(() => document.documentElement.dataset.tema)) !== tema) await page.getByTitle('Cambiar tema').click();
      await page.getByRole('button', { name: 'Descanso', exact: true }).first().click();
      await page.waitForTimeout(800);
      const boton = page.locator('.reloj__mandos .btn--fuerte');
      const tomar = async (nombre) => {
        await page.screenshot({ path: path.join(OUT, `${nombre}.png`) });
        cajas[nombre] = await page.evaluate(() => {
          const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
          const o = {};
          document.querySelectorAll('.mono').forEach((m) => { const c = [...m.classList].find((k) => k.startsWith('mono--')); o[c] = r(m); });
          for (const s of ['.reloj__mandos', '.tiempos', '.reloj__cuenta']) { const e = document.querySelector(s); if (e) o[s] = r(e); }
          return o;
        });
      };
      for (let p = 0; p < PIELES; p++) {
        await tomar(`${tema}-piel${p}-siesta`);
        await boton.click(); await page.clock.runFor(1500);
        await tomar(`${tema}-piel${p}-estudia`);
        await page.getByRole('button', { name: 'Saltar' }).click();
        if ((await boton.textContent()) !== 'Pausar') await boton.click();
        await page.clock.runFor(1500);
        await tomar(`${tema}-piel${p}-recreo`);
        if ((await boton.textContent()) === 'Pausar') await boton.click();
        await page.getByRole('button', { name: 'Reiniciar' }).click();
        if (p < PIELES - 1) { await page.clock.runFor(15 * 60 * 1000 + 100); await page.clock.runFor(1000); }
      }
      await ctx.close();
    }
  } finally {
    fs.writeFileSync(path.join(OUT, 'cajas.json'), JSON.stringify(cajas, null, 1));
    await browser.close(); console.log('errores consola:', JSON.stringify(errores));
  }
})();
