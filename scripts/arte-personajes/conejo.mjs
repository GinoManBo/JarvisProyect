import { Parte } from './lib.mjs'
const rad = (g) => (g * Math.PI) / 180
const SOM = { F: 'G' }

/** Dibuja los ojos/cara sobre el lienzo. m = 1 mira a la derecha, -1 izquierda */
export function cara(L, cx, cy, o = {}) {
  const m = o.mira ?? 1, ojos = o.ojos ?? 'abiertos', boca = o.boca ?? 'normal'
  const X = (d) => Math.round(cx + m * d)
  const ojo = (d0) => { // d0 = columna interior (lado izq. si m=1) del ojo de 3 px
    const xs = [0, 1, 2].map((i) => X(d0 + i)).sort((a, b) => a - b)
    const y = Math.round(cy) - 2
    if (ojos === 'abiertos') { for (const x of xs) for (let j = 0; j < 3; j++) L.set(x, y + j, 'B'); L.set(xs[0], y, 'F') }
    else if (ojos === 'grandes') { for (const x of xs) for (let j = -1; j < 3; j++) L.set(x, y + j, 'B'); L.set(xs[0], y - 1, 'F'); L.set(xs[1], y - 1, 'F'); L.set(xs[0], y, 'F') }
    else if (ojos === 'cerrados') { for (const x of xs) L.set(x, y + 1, 'B') }
    else if (ojos === 'felices') { L.set(xs[0], y + 1, 'B'); L.set(xs[1], y, 'B'); L.set(xs[2], y + 1, 'B') }
    else if (ojos === 'apretados') { L.set(xs[0], y, 'B'); L.set(xs[1], y + 1, 'B'); L.set(xs[2], y, 'B') }
  }
  ojo(-6); ojo(3)
  const ny = Math.round(cy) + 2 + (o.nariz ?? 0)
  L.set(X(-1), ny, 'H'); L.set(X(0), ny, 'H')
  // mejillas
  if (o.mejillas !== false) { L.set(X(-7), ny, 'H'); L.set(X(-6), ny, 'H'); L.set(X(5), ny, 'H'); L.set(X(6), ny, 'H') }
  if (boca === 'normal') { L.set(X(-1), ny + 1, 'B'); L.set(X(0), ny + 1, 'B') }
  else if (boca === 'abierta') { L.set(X(-1), ny + 1, 'B'); L.set(X(0), ny + 1, 'B'); L.set(X(-1), ny + 2, 'B'); L.set(X(0), ny + 2, 'B') }
  else if (boca === 'grito') { for (let j = 1; j <= 3; j++) { L.set(X(-2), ny + j, 'B'); L.set(X(1), ny + j, 'B'); L.set(X(-1), ny + j, j === 1 ? 'B' : 'H'); L.set(X(0), ny + j, j === 1 ? 'B' : 'H') } L.set(X(-1), ny + 4, 'B'); L.set(X(0), ny + 4, 'B') }
  else if (boca === 'w') { L.set(X(-2), ny + 1, 'B'); L.set(X(1), ny + 1, 'B'); L.set(X(-1), ny + 2, 'B'); L.set(X(0), ny + 2, 'B') }
}

function oreja(P, bx, by, e, color = 'F') {
  // e: {a, l, a2, l2, r}
  const r = e.r ?? 1.7
  const tx = bx + e.l * Math.sin(rad(e.a)), ty = by - e.l * Math.cos(rad(e.a))
  P.capsula(bx, by, tx, ty, r, color)
  let fx = tx, fy = ty
  if (e.l2) { fx = tx + e.l2 * Math.sin(rad(e.a2)); fy = ty - e.l2 * Math.cos(rad(e.a2)); P.capsula(tx, ty, fx, fy, r, color) }
  return { tx, ty, fx, fy }
}
function orejaRosa(P, bx, by, e, pts) {
  const k = 0.3
  const sx = bx + (pts.tx - bx) * k, sy = by + (pts.ty - by) * k
  if (e.l2) { P.capsula(sx, sy, pts.tx, pts.ty, 0.6, 'H'); P.capsula(pts.tx, pts.ty, pts.tx + (pts.fx - pts.tx) * 0.75, pts.ty + (pts.fy - pts.ty) * 0.75, 0.6, 'H') }
  else P.capsula(sx, sy, bx + (pts.tx - bx) * 0.88, by + (pts.ty - by) * 0.88, 0.6, 'H')
}

/**
 * pose: { dx, dy, cola:[x,y,r], cuerpo:[cx,cy,rx,ry,rot], muslo:[cx,cy,rx,ry,rot]|null,
 *   pataT:[x0,y0,x1,y1,r]|null, pataT2, pataD:[[x0,y0,x1,y1],…], cabeza:[cx,cy,rx,ry],
 *   orejas:[lejos, cerca] cada una {a,l,a2,l2}, baseO:[[dx,dy],[dx,dy]], cara:{…}, extra(L) }
 */
export function conejo(p) {
  const L = new Parte()
  const dx = p.dx ?? 0, dy = p.dy ?? 0
  const m = p.cara?.mira ?? 1
  if (p.pataT2) new Parte().capsula(p.pataT2[0] + dx, p.pataT2[1] + dy, p.pataT2[2] + dx, p.pataT2[3] + dy, p.pataT2[4] ?? 1.5, 'G').sobre(L)
  for (const q of p.pataDlejos ?? []) new Parte().capsula(q[0] + dx, q[1] + dy, q[2] + dx, q[3] + dy, q[4] ?? 1.5, 'G').sobre(L)
  if (p.cola) new Parte().elipse(p.cola[0] + dx, p.cola[1] + dy, p.cola[2] ?? 2.6, p.cola[2] ?? 2.6, 'F').sombra(SOM).sobre(L)
  const c = p.cuerpo
  new Parte().elipse(c[0] + dx, c[1] + dy, c[2], c[3], 'F', c[4] ?? 0).pulir().sombra(SOM, 2).sobre(L)
  if (p.muslo) { const u = p.muslo; new Parte().elipse(u[0] + dx, u[1] + dy, u[2], u[3], 'F', u[4] ?? 0).pulir().sombra(SOM).sobre(L) }
  if (p.pataT) new Parte().capsula(p.pataT[0] + dx, p.pataT[1] + dy, p.pataT[2] + dx, p.pataT[3] + dy, p.pataT[4] ?? 1.5, 'F').sobre(L)
  for (const q of p.pataD ?? []) new Parte().capsula(q[0] + dx, q[1] + dy, q[2] + dx, q[3] + dy, q[4] ?? 1.5, 'F').sobre(L)
  const h = p.cabeza, hx = h[0] + dx, hy = h[1] + dy
  const bases = p.baseO ?? [[-4, -5], [3, -5]]
  const dib = (i) => { const e = p.orejas[i]; if (!e) return; const P = new Parte(); const bx = hx + m * bases[i][0], by = hy + bases[i][1]; const ee = { ...e, a: m * e.a, a2: m * (e.a2 ?? 0) }; const pts = oreja(P, bx, by, ee); orejaRosa(P, bx, by, ee, pts); P.sobre(L) }
  const delante = p.orejasDelante ?? false
  if (!delante) { dib(0); dib(1) }
  new Parte().elipse(hx, hy, h[2] ?? 9.5, h[3] ?? 7.5, 'F').pulir().sombra(SOM).sobre(L)
  if (delante) { dib(0); dib(1) }
  if (p.cara !== null) cara(L, hx + m * 0.5, hy, p.cara ?? {})
  if (p.extra) p.extra(L, dx, dy)
  return L
}
export const mezcla = (a, b) => ({ ...a, ...b })
