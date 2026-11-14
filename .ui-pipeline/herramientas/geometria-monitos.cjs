const { chromium } = require('playwright');
(async () => {
  for (const [W,H] of [[1180,780],[1180,800],[1440,900],[1100,760],[1180,745]]) {
  const b = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH });
  const page = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  await page.goto('http://localhost:5199');
  await page.getByRole('button', { name: 'Descanso', exact: true }).first().click();
  await page.waitForTimeout(800);
  const boton = page.locator('.reloj__mandos .btn--fuerte');
  await boton.click(); await page.getByRole('button', { name: 'Saltar' }).click();
  if ((await boton.textContent()) !== 'Pausar') await boton.click();
  let minTop = {}; 
  for (let i=0;i<60;i++){ await page.waitForTimeout(150); const d = await page.evaluate(()=>{const c=document.querySelector('.reloj__cuenta').getBoundingClientRect(); const o={cuenta:c.bottom, tiempos:document.querySelector('.tiempos').getBoundingClientRect().bottom}; document.querySelectorAll('.mono').forEach(m=>{const n=[...m.classList].find(k=>k.startsWith('mono--')).slice(6); const f=m.querySelector('.mono__fig').getBoundingClientRect(); o[n]=f.top;}); return o;}); for (const k in d) minTop[k]= k==='cuenta'||k==='tiempos'? d[k] : Math.min(minTop[k]??1e9, d[k]); }
  console.log(W,H,JSON.stringify(Object.fromEntries(Object.entries(minTop).map(([k,v])=>[k,Math.round(v)]))));
  await b.close(); }
})();
