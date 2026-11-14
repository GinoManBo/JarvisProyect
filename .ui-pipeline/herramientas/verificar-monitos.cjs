// Mediciones del lote: solapes de las figuras con el reloj, quietud en foco, patrulla, reduced-motion.
// Uso: [ANCHO=1440 ALTO=900] [REDUCIDO=1] node run.js verificar-monitos.cjs
const { chromium } = require('playwright');
const W = Number(process.env.ANCHO || 1440), H = Number(process.env.ALTO || 900);
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: process.env.REDUCIDO ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto('http://localhost:5199');
  await page.getByRole('button', { name: 'Descanso', exact: true }).first().click();
  await page.waitForTimeout(900);
  const boton = page.locator('.reloj__mandos .btn--fuerte');
  const medir = () => page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
    const figs = {};
    document.querySelectorAll('.mono').forEach((m) => { const c = [...m.classList].find((k) => k.startsWith('mono--')).slice(6); const f = m.querySelector('.mono__fig'); figs[c] = { fig: f && r(f), carril: r(m), disp: getComputedStyle(m).display }; });
    const obst = {};
    for (const s of ['.reloj__rotulo', '.anillo', '.reloj__mandos', '.tiempos', '.reloj__cuenta']) { const e = document.querySelector(s); if (e) obst[s] = r(e); }
    const anim = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('.mono')).map((a) => `${a.animationName}@${[...a.effect.target.closest('.mono').classList].find((k) => k.startsWith('mono--'))}`);
    return { figs, obst, anim, centro: r(document.querySelector('.reloj__centro')) };
  });
  const choque = (a, o, m = 0) => !(a.r + m <= o.x || o.r + m <= a.x || a.b + m <= o.y || o.b + m <= a.y);
  const informe = (n, d) => {
    const lista = [];
    const nombres = Object.keys(d.figs).filter((k) => d.figs[k].disp !== 'none');
    for (const k of nombres) {
      const f = d.figs[k].fig; if (!f) continue;
      for (const [s, o] of Object.entries(d.obst)) if (choque(f, o, k === 'appa' ? 10 : 6)) lista.push(`${k} x ${s}`);
      for (const j of nombres) if (j > k && d.figs[j].fig && choque(f, d.figs[j].fig, k === 'appa' || j === 'appa' ? 0 : 8)) lista.push(`${k} x ${j}`);
      if (k !== 'appa' && f.b > H) lista.push(`${k} pasa el borde inferior`);
      if (k === 'appa' && (f.y < 58 || f.y < d.centro.y)) lista.push(`appa top ${f.y}`);
    }
    console.log(n.padEnd(10), 'choques:', JSON.stringify(lista), '| ocultos:', nombres.length < 7 ? 7 - nombres.length : 0);
  };
  const dormido = await medir(); informe('siesta', dormido);
  await page.waitForTimeout(1500);
  await boton.click(); await page.waitForTimeout(1500);
  const e0 = await medir(); await page.waitForTimeout(3000); const e1 = await medir();
  informe('estudia', e0);
  const desp = Object.fromEntries(Object.keys(e0.figs).filter((k) => e0.figs[k].fig).map((k) => [k, Math.round(Math.hypot(e1.figs[k].fig.x - e0.figs[k].fig.x, e1.figs[k].fig.y - e0.figs[k].fig.y) * 10) / 10]));
  console.log('estudia desplazamiento 3s (px):', JSON.stringify(desp), '| animaciones corriendo:', JSON.stringify(e1.anim));
  await page.getByRole('button', { name: 'Saltar' }).click();
  if ((await boton.textContent()) !== 'Pausar') await boton.click();
  await page.waitForTimeout(1500);
  const lecturas = [];
  for (let i = 0; i < 4; i++) { lecturas.push(await medir()); informe('recreo' + i, lecturas[i]); await page.waitForTimeout(2500); }
  const dx = Object.fromEntries(Object.keys(lecturas[0].figs).filter((k) => lecturas[0].figs[k].fig).map((k) => [k, Math.round(lecturas[3].figs[k].fig.x - lecturas[0].figs[k].fig.x)]));
  console.log('recreo dx 7.5s (px):', JSON.stringify(dx));
  const dentro = Object.keys(lecturas[0].figs).filter((k) => lecturas.some((l) => l.figs[k].fig && (l.figs[k].fig.x < l.figs[k].carril.x - 1 || l.figs[k].fig.r > l.figs[k].carril.r + 1)));
  console.log('fuera de carril:', JSON.stringify(dentro), '| animaciones corriendo en recreo:', lecturas[3].anim.length, '| getAnimations total', await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.mono')).length));
  console.log('errores:', JSON.stringify(errs));
  await b.close();
})();
