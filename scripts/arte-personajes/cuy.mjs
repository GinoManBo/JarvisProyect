import { Parte, contacto } from './lib.mjs'
import { cara } from './conejo.mjs'
const SOM = { F: 'G', E: 'I' }
/**
 * pose: { dx, dy, cuerpo:[cx,cy,rx,ry,rot], cabeza:[cx,cy,rx,ry], patas:[[x0,y0,x1,y1],…] (delante del cuerpo),
 *   patasLejos:[…], orejas:[[dx,dy],[dx,dy]] | null, cara:{…}, extra }
 */
export function cuy(p) {
  const L = new Parte(), dx = p.dx ?? 0, dy = p.dy ?? 0
  const m = p.cara?.mira ?? 1
  for (const q of p.patasLejos ?? []) new Parte().capsula(q[0] + dx, Math.min(q[1], 58.5) + dy, q[2] + dx, Math.min(q[3], 58.5) + dy, q[4] ?? 1.1, 'H').sobre(L)
  const c = p.cuerpo, h = p.cabeza
  const hx = h[0] + dx, hy = h[1] + dy, hrx = h[2] ?? 8.5, hry = h[3] ?? 8
  // orejas (detrás de la cabeza)
  const ore = p.orejas === undefined ? [[-7, -6], [7, -6]] : p.orejas
  const orejaC = (o) => new Parte().elipse(hx + m * o[0], hy + o[1], o[2] ?? 2.6, o[3] ?? 2.2, 'H').sobre(L)
  if (ore?.[1]) orejaC(ore[1])
  const P = new Parte()
  P.elipse(c[0] + dx, c[1] + dy, c[2], c[3], 'F', c[4] ?? 0)
  // mancha naranja de la grupa
  const enCuerpo = P.dentro()
  const co = Math.cos(((c[4] ?? 0) * Math.PI) / 180), si = Math.sin(((c[4] ?? 0) * Math.PI) / 180)
  const gx = c[0] + dx - m * c[2] * 0.62 * co, gy = c[1] + dy - m * c[2] * 0.62 * si
  P.elipse(gx, gy - 1, c[2] * 0.58, c[3] * 1.2, 'E', c[4] ?? 0, enCuerpo)
  // cabeza: parches de color con lucero blanco
  P.elipse(hx, hy, hrx, hry, 'F')
  const enCabeza = (x, y) => { const u = (x - hx) / hrx, v = (y - hy) / hry; return u * u + v * v <= 1 }
  const fx = hx + m * 0.5
  P.cada((x, y) => {
    if (!enCabeza(x, y)) return
    const d = (x - fx) * m
    const lucero = Math.abs(d + 0.5) <= 1.6 || ((d + 0.5) ** 2) / 30 + ((y - (hy + 5)) ** 2) / 14 <= 1
    if (lucero) return
    if (y > hy + 4) return
    P.p[y * 64 + x] = d < 0 ? 'I' : 'E'
  })
  P.pulir().sombra(SOM, 1).sobre(L)
  if (ore?.[0]) orejaC([ore[0][0] + 1, ore[0][1], ore[0][2], ore[0][3]])
  for (const q of p.patas ?? []) new Parte().capsula(q[0] + dx, Math.min(q[1], 58.5) + dy, q[2] + dx, Math.min(q[3], 58.5) + dy, q[4] ?? 1.1, 'H').sobre(L)
  if (p.cara !== null) cara(L, fx, hy, { mejillas: false, ...(p.cara ?? {}) })
  if (p.extra) p.extra(L, dx, dy)
  return L
}
const mz = (a, b) => ({ ...a, ...b })
const base = { dx: 1, cuerpo: [27, 48, 13.5, 9.5], cabeza: [40, 46], patasLejos: [[21, 58.5, 23, 58.5], [36, 58.5, 38, 58.5]], patas: [[17, 58.5, 19, 58.5], [41, 58.5, 43, 58.5]] }
const Q = (o = {}) => cuy(mz(base, o))
export const anim = {}
anim.reposo = { dur: [700, 350, 160, 110, 300, 220], bucle: true, fijo: 0, cuadros: [
  Q(),
  Q({ cuerpo: [27, 47.5, 13.5, 10], cabeza: [40, 45.5] }),
  Q({ cara: { nariz: -1 } }),
  Q({ cara: { ojos: 'cerrados' } }),
  Q({ cuerpo: [27, 47.5, 13.5, 10], cabeza: [40, 45.5], cara: { nariz: -1 } }),
  Q({ orejas: [[-8, -5, 2.6, 1.8], [8, -5, 2.6, 1.8]] }),
] }
// correteo: 0–60 suelo, 60–204 aire (25–85 %), 204–240 suelo
anim.caminar = { dur: [60, 70, 74, 36], bucle: true, fijo: 0, cuadros: [
  cuy({ dx: 1, cuerpo: [28, 48, 12.5, 10], cabeza: [40, 46.5], patasLejos: [[25, 58.5, 27, 58.5], [34, 58.5, 36, 58.5]], patas: [[21, 58.5, 23, 58.5], [38, 58.5, 40, 58.5]], orejas: [[-7, -6], [7, -6]] }),
  cuy({ dx: 1, cuerpo: [26, 49.5, 15, 8], cabeza: [41, 46], patasLejos: [[15, 56, 13, 57.5], [44, 55.5, 46, 56.5]], patas: [[14, 56.5, 12.5, 57.5, 1.3], [45, 56.5, 46, 57.5, 1.3]], orejas: [[-8, -4, 2.8, 1.7], [7, -5.5, 2.8, 1.7]] }),
  cuy({ dx: 1, cuerpo: [27, 49, 14.5, 8.5], cabeza: [41, 46.5], patasLejos: [[18, 57.5, 16, 59], [41, 57.5, 43, 59]], patas: [[15, 57.5, 13, 59], [44, 57.5, 45.5, 58.5]], orejas: [[-8, -4.5, 2.8, 1.8], [7, -5.5, 2.8, 1.8]] }),
  cuy({ dx: 1, cuerpo: [27, 48.5, 13, 9.5], cabeza: [40, 47.5], patasLejos: [[22, 58, 23, 58.5], [37, 58.5, 39, 58.5]], patas: [[18, 58, 19, 58.5], [42, 58.5, 44, 58.5]] }),
] }
const zetas = (...zs) => (L) => zs.forEach(([x, y]) => L.sello(x, y, ['BBB', '.B.', 'BBB']))
const plano = (r, o = {}) => cuy(mz({ dx: 0, cuerpo: [28, 53.5 - r / 2, 14.5, 6 + r / 2], cabeza: [42, 52.5 - r / 4, 8, 7], patasLejos: [], patas: [[14.5, 57.5, 13, 57.5], [46, 57.5, 47, 57.5]], orejas: [[-7, -5, 2.6, 1.8], [7, -5, 2.6, 1.8]], cara: { ojos: 'cerrados' } }, o))
anim.dormir = { dur: [700, 500, 600, 800], bucle: true, fijo: 0, cuadros: [
  plano(0), plano(1, { extra: zetas([47, 37]) }), plano(2, { extra: zetas([48, 34], [51, 28]) }), plano(1, { extra: zetas([50, 30]) }),
] }
const bolita = (o) => cuy(mz({ dx: 1, cuerpo: [30, 26, 11.5, 13], cabeza: [35, 20, 8.5, 8], orejas: [[-7, -6], [7, -6]], cara: { ojos: 'grandes' } }, o))
anim.colgar = { dur: [100, 80, 100, 80], bucle: true, fijo: 0, cuadros: [
  bolita({ patasLejos: [[26, 39, 24, 42], [42, 28, 45, 27]], patas: [[33, 39, 35, 42], [42, 32, 45, 34]] }),
  bolita({ cuerpo: [30, 26, 11.5, 13, 3], patasLejos: [[26, 39, 25, 42.5], [42, 28, 45, 29]], patas: [[33, 39, 33, 42.5], [42, 32, 45, 32]] }),
  bolita({ patasLejos: [[26, 39, 28, 42], [42, 28, 45, 31]], patas: [[33, 39, 31, 42], [42, 32, 45, 30]] }),
  bolita({ cuerpo: [30, 26, 11.5, 13, -3], patasLejos: [[26, 39, 26, 42.5], [42, 28, 45, 29]], patas: [[33, 39, 34, 42.5], [42, 32, 45, 33]] }),
] }
anim.caer = { dur: [60, 120, 90, 180], bucle: false, fijo: 3, cuadros: [
  cuy({ dx: 0, cuerpo: [28, 54, 15.5, 5.5], cabeza: [42, 52, 8.5, 7], patas: [[14.5, 57.5, 13, 57.5], [46, 57.5, 47, 57.5]], orejas: [[-8, -4, 2.8, 1.6], [8, -4, 2.8, 1.6]], cara: { ojos: 'apretados' } }),
  cuy({ dx: 0, cuerpo: [28, 53, 15.5, 6.5], cabeza: [42, 51, 8.5, 7.5], patas: [[15, 57.5, 13.5, 57.5], [45, 57.5, 46.5, 57.5]], orejas: [[-8, -6.5, 2.6, 2.4], [8, -6.5, 2.6, 2.4]], cara: { ojos: 'apretados' } }),
  Q({ cuerpo: [28, 46, 12, 11.5], cabeza: [40, 43], patas: [[19, 58.5, 21, 58.5], [40, 58.5, 42, 58.5]], patasLejos: [[23, 58.5, 25, 58.5], [36, 58.5, 38, 58.5]] }),
  Q(),
] }
// palomitas: 3 saltos de 255 ms (el motor: |sin| × 3 sobre el 85 % de la jugada)
const sube = (o = {}) => cuy(mz({ dx: 1, cuerpo: [27, 46.5, 12.5, 10.5, -14], cabeza: [39, 41], patasLejos: [[22, 56, 22, 58], [35, 55, 36, 57.5]], patas: [[18, 55.5, 17.5, 58.5, 1.3], [40, 54.5, 41.5, 57, 1.3]], orejas: [[-8, -4, 2.6, 1.8], [8, -4, 2.6, 1.8]], cara: { ojos: 'felices' } }, o))
const patada = (o = {}) => cuy(mz({ dx: 1, cuerpo: [27, 47, 13, 9.5, 8], cabeza: [40, 45], patasLejos: [[20, 55.5, 18.5, 58.5], [36, 55.5, 37.5, 58.5]], patas: [[15, 53.5, 12, 55, 1.3], [43, 54.5, 46, 56, 1.3]], orejas: [[-8, -8, 2.4, 2.6], [8, -8, 2.4, 2.6]], cara: { ojos: 'felices', boca: 'abierta' } }, o))
const estrella = cuy({ dx: 1, cuerpo: [27, 47, 14, 9], cabeza: [41, 44], patasLejos: [[19, 55.5, 17.5, 58.5], [37, 55.5, 39, 58.5]], patas: [[14, 50, 11, 48, 1.3], [44, 52.5, 47, 54.5, 1.3], [16, 54.5, 13, 57.5, 1.3]], orejas: [[-8, -8, 2.4, 2.6], [8, -8, 2.4, 2.6]], cara: { ojos: 'felices', boca: 'abierta' } })
const baja = (o = {}) => cuy(mz({ dx: 1, cuerpo: [27, 47.5, 13, 9.5, 10], cabeza: [40, 47], patasLejos: [[22, 56, 23, 58], [36, 57, 37, 59]], patas: [[18, 55, 19, 58], [41, 57, 43, 59]], orejas: [[-7, -8, 2.4, 2.6], [7, -8, 2.4, 2.6]], cara: { ojos: 'felices' } }, o))
anim.jugar = { dur: [85, 85, 85, 85, 85, 85, 85, 85, 85, 60, 75], bucle: false, fijo: 10, impacto: 4, cuadros: [
  sube(), patada(), baja(),
  sube({ cuerpo: [27, 46.5, 12.5, 10.5, -20] }), patada().espejo().mover(1, 0), baja(),
  sube({ cuerpo: [27, 46, 12, 11, -22], cabeza: [39, 40] }), estrella, baja({ cara: { ojos: 'abiertos' } }),
  cuy({ dx: 1, cuerpo: [27, 50, 14.5, 8], cabeza: [41, 48.5, 8.5, 7.5], patas: [[15, 58.5, 13, 58.5], [44, 58.5, 46, 58.5]], patasLejos: [], cara: { ojos: 'apretados' } }),
  Q(),
] }
// chillido (wheek)
const ondas = (n) => (L) => { L.linea(54, 32, 54, 33, 'B'); L.linea(53, 40, 54, 40, 'B'); if (n > 1) { L.linea(48, 27, 48, 28, 'B'); L.linea(52, 46, 53, 46, 'B') } }
anim.reaccion = { dur: [70, 130, 220, 100, 200], bucle: false, fijo: 2, cuadros: [
  Q({ cuerpo: [27, 49.5, 14.5, 8], cabeza: [40, 48, 8.5, 7.5], cara: { ojos: 'grandes' } }),
  cuy({ dx: 1, cuerpo: [26, 47.5, 14, 9, -10], cabeza: [40, 41.5], patasLejos: [[21, 58.5, 23, 58.5], [35, 57, 37, 58.5]], patas: [[17, 58.5, 19, 58.5], [40, 57, 42, 58.5]], orejas: [[-8, -5, 2.6, 1.8], [8, -5, 2.6, 1.8]], cara: { ojos: 'apretados', boca: 'grito' }, extra: ondas(1) }),
  cuy({ dx: 1, cuerpo: [26, 47, 14, 9, -14], cabeza: [40, 40], patasLejos: [[21, 58.5, 23, 58.5], [35, 56.5, 37, 58.5]], patas: [[17, 58.5, 19, 58.5], [40, 56.5, 42, 58.5]], orejas: [[-8, -4.5, 2.6, 1.7], [8, -4.5, 2.6, 1.7]], cara: { ojos: 'apretados', boca: 'grito' }, extra: ondas(2) }),
  Q({ cuerpo: [27, 48, 13.5, 9.5], cabeza: [40, 44.5], cara: { boca: 'abierta' } }),
  Q(),
] }
if (process.argv[2] === 'ver') {
  const cuales = process.argv[3] ? process.argv[3].split(',') : Object.keys(anim)
  contacto('ver-cuy.png', cuales.flatMap((n) => anim[n].cuadros), Number(process.argv[4] ?? 7), Number(process.argv[5] ?? 4))
  for (const n of cuales) console.log(n, anim[n].cuadros.map((c, i) => { const b = c.caja(); return `${i}:x${b.x0}-${b.x1} y${b.y0}-${b.y1}` }).join(' | '))
}
if (process.argv[2] === 'ascii') console.log(anim[process.argv[3]].cuadros[Number(process.argv[4])].ascii())
