import { conejo, mezcla } from './conejo.mjs'
import { contacto, tira, tiraAPartes, Parte } from './lib.mjs'
const DX = 2
const sent = { dx: DX, cola: [16, 53], cuerpo: [27, 48, 10.5, 11], muslo: [24, 52, 7, 7], pataT: [24, 58, 33, 58], pataDlejos: [[34, 50, 34, 58]], pataD: [[37, 49, 37, 58]], cabeza: [35, 33], orejas: [{ a: -8, l: 12 }, { a: 8, l: 12 }] }
const S = (o) => conejo(mezcla(sent, o))

export const anim = {}
anim.reposo = { dur: [700, 350, 450, 110, 220, 300], bucle: true, fijo: 0, cuadros: [
  S({}),
  S({ cuerpo: [27, 47.5, 10.5, 11.5], cabeza: [35, 32], orejas: [{ a: -8, l: 12 }, { a: 8, l: 12 }] }),
  S({ cara: { nariz: -1 } }),
  S({ cara: { ojos: 'cerrados' } }),
  S({ orejas: [{ a: -8, l: 12 }, { a: 26, l: 7, a2: 70, l2: 5 }], cara: { nariz: -1 } }),
  S({ cuerpo: [27, 47.5, 10.5, 11.5], cabeza: [35, 32], orejas: [{ a: -12, l: 12 }, { a: 14, l: 12 }] }),
] }

// salto: 0–150 suelo, 150–510 aire (25–85 %), 510–600 suelo
anim.caminar = { dur: [80, 70, 110, 140, 110, 90], bucle: true, fijo: 0, cuadros: [
  // 0 agazapado (anticipación)
  conejo({ dx: DX, cola: [14, 52], cuerpo: [26, 51, 12, 8.5], muslo: [22, 53, 7, 6], pataT: [21, 58, 31, 58], pataDlejos: [[35, 53, 36, 58]], pataD: [[38, 53, 39, 58]], cabeza: [38, 41], orejas: [{ a: -50, l: 13 }, { a: -38, l: 13 }] }),
  // 1 empuje: estirado, patas traseras aún en el suelo
  conejo({ dx: DX, cola: [13, 50], cuerpo: [26, 47, 13, 7.5, -22], muslo: [19, 51, 6, 5.5, -30], pataT: [13, 58, 20, 58], pataDlejos: [[38, 46, 43, 48]], pataD: [[40, 47, 45, 50]], cabeza: [40, 35], orejas: [{ a: -70, l: 13 }, { a: -60, l: 13 }] }),
  // 2 en el aire, estirado
  conejo({ dx: DX, cola: [12, 49], cuerpo: [26, 49, 13.5, 7], muslo: [18, 51, 6, 5, 10], pataT: [12, 56, 17, 54.5], pataDlejos: [[39, 52, 44, 54]], pataD: [[40, 53, 45, 56]], cabeza: [41, 41], orejas: [{ a: -84, l: 13 }, { a: -76, l: 13 }] }),
  // 3 cúspide, recogido
  conejo({ dx: DX, cola: [14, 49], cuerpo: [27, 49, 12, 8], muslo: [22, 52, 6.5, 6], pataT: [22, 58, 30, 57], pataDlejos: [[37, 54, 40, 57]], pataD: [[39, 54, 43, 57]], cabeza: [40, 40], orejas: [{ a: -62, l: 13 }, { a: -48, l: 13 }] }),
  // 4 bajando: manos buscan el suelo
  conejo({ dx: DX, cola: [14, 44], cuerpo: [27, 47, 13, 7.5, 18], muslo: [19, 46, 6, 5.5, 20], pataT: [12, 49, 18, 51], pataDlejos: [[38, 52, 41, 58]], pataD: [[40, 52, 44, 58]], cabeza: [41, 43], orejas: [{ a: -30, l: 13 }, { a: -16, l: 13 }] }),
  // 5 aterriza: aplastado, orejas se van hacia delante
  conejo({ dx: DX, cola: [15, 50], cuerpo: [27, 51, 12.5, 8.5], muslo: [22, 53, 7, 6], pataT: [22, 58, 31, 58], pataDlejos: [[36, 53, 37, 58]], pataD: [[39, 53, 41, 58]], cabeza: [39, 43], orejas: [{ a: -22, l: 8, a2: 20, l2: 5 }, { a: -6, l: 8, a2: 35, l2: 5 }] }),
] }


// --- dormir: bolita, orejas planas sobre el lomo ---
const zeta = (x, y) => (L) => L.sello(x, y, ['BBB', '.B.', 'BBB'])
const zetas = (...zs) => (L) => zs.forEach(([x, y, g]) => g ? L.sello(x, y, ['BBBB', '..B.', '.B..', 'BBBB']) : L.sello(x, y, ['BBB', '.B.', 'BBB']))
const bola = (r, o = {}) => conejo(mezcla({ dx: DX, cola: [15, 53], cuerpo: [28, 52 - r / 2, 13, 7.5 + r / 2], cabeza: [38, 51 - r / 3, 8.5, 7], orejas: [{ a: -78, l: 12 }, { a: -88, l: 12 }], baseO: [[-5, -4], [-3, -3]], orejasDelante: false, cara: { ojos: 'cerrados' } }, o))
anim.dormir = { dur: [700, 500, 600, 800], bucle: true, fijo: 0, cuadros: [
  bola(0), bola(1, { extra: zetas([46, 36]) }), bola(2, { extra: zetas([46, 34], [49, 28]) }), bola(1, { extra: zetas([48, 30]) }),
] }

// --- colgar: agarre (32, 8); patas traseras pedalean ---
const cuelga = (o) => conejo(mezcla({ dx: 1, cola: [22, 45], cuerpo: [30, 35, 8, 13], cabeza: [32, 18], orejas: [{ a: -138, l: 11 }, { a: 138, l: 11 }], baseO: [[-6, 0], [5, 0]], orejasDelante: true, pataD: [[36, 31, 39, 35, 1.4]], pataDlejos: [[33, 32, 36, 37, 1.4]], cara: { ojos: 'grandes' } }, o))
anim.colgar = { dur: [110, 90, 110, 90], bucle: true, fijo: 0, cuadros: [
  cuelga({ muslo: [29, 46, 5.5, 5], pataT: [31, 49, 39, 47, 1.6], pataT2: [26, 50, 24, 57, 1.6] }),
  cuelga({ cuerpo: [30, 35, 8, 13, 3], cola: [21, 45], muslo: [29, 46, 5.5, 5], pataT: [31, 50, 38, 52, 1.6], pataT2: [27, 50, 29, 56, 1.6], orejas: [{ a: -144, l: 11 }, { a: 132, l: 11 }] }),
  cuelga({ muslo: [29, 46, 5.5, 5], pataT: [30, 50, 30, 57, 1.6], pataT2: [27, 49, 36, 49, 1.6], pataD: [[36, 32, 40, 34, 1.4]] }),
  cuelga({ cuerpo: [30, 35, 8, 13, -3], cola: [23, 45], muslo: [29, 46, 5.5, 5], pataT: [31, 50, 35, 56, 1.6], pataT2: [27, 50, 31, 54, 1.6], orejas: [{ a: -132, l: 11 }, { a: 144, l: 11 }] }),
] }

// --- caer: aplaste y recuperación, termina en reposo[0] ---
anim.caer = { dur: [60, 120, 90, 180], bucle: false, fijo: 3, cuadros: [
  conejo({ dx: 0, cola: [13, 54], cuerpo: [26, 53, 13.5, 6.5], pataT: [14, 58, 22, 58], pataD: [[39, 57, 44, 58]], cabeza: [36, 47, 9.5, 7], orejas: [{ a: 40, l: 7, a2: 95, l2: 6 }, { a: 55, l: 7, a2: 110, l2: 6 }], orejasDelante: true, cara: { ojos: 'apretados' } }),
  conejo({ dx: 0, cola: [12, 55], cuerpo: [27, 54, 14, 5.5], pataT: [15, 58, 22, 58], pataD: [[40, 57, 46, 58]], cabeza: [37, 49, 10, 6.5], orejas: [{ a: 75, l: 7, a2: 120, l2: 6 }, { a: 88, l: 7, a2: 135, l2: 6 }], orejasDelante: true, cara: { ojos: 'apretados' } }),
  S({ cola: [17, 51], cuerpo: [27, 45.5, 9.5, 13.5], muslo: [24, 51, 6.5, 8], cabeza: [35, 30], orejas: [{ a: -14, l: 12 }, { a: 2, l: 12 }], pataD: [[37, 47, 37, 58]], pataDlejos: [[34, 48, 34, 58]] }),
  S({}),
] }

// --- jugar: binky. Arco del motor: 240–720 ms, cúspide (impacto) en 480 ---
const giro = conejo({ dx: -DX, cola: [15, 44], cuerpo: [27, 48, 12.5, 7.5, 12], muslo: [19, 45, 6, 5.5, 30], pataT: [14, 42, 9, 36, 1.6], pataT2: [17, 41, 14, 34, 1.6], pataDlejos: [[36, 53, 39, 57]], pataD: [[39, 53, 43, 56]], cabeza: [40, 42], orejas: [{ a: -100, l: 13 }, { a: -70, l: 13 }], cara: { ojos: 'felices', boca: 'abierta' } }).espejo().mover(-4, 0)
anim.jugar = { dur: [150, 90, 80, 80, 80, 110, 110, 100, 200], bucle: false, fijo: 8, impacto: 5, cuadros: [
  // 0 se agazapa
  conejo({ dx: DX, cola: [14, 53], cuerpo: [26, 51.5, 12.5, 8], muslo: [22, 53, 7, 6], pataT: [21, 58, 31, 58], pataDlejos: [[35, 53, 36, 58]], pataD: [[38, 53, 39, 58]], cabeza: [38, 42], orejas: [{ a: -40, l: 13 }, { a: -28, l: 13 }] }),
  // 1 más abajo, cola arriba
  conejo({ dx: DX, cola: [12, 50], cuerpo: [25, 52.5, 13.5, 7], muslo: [20, 54, 7, 5.5], pataT: [19, 58, 29, 58], pataDlejos: [[35, 54, 37, 58]], pataD: [[38, 54, 41, 58]], cabeza: [38, 45], orejas: [{ a: -66, l: 13 }, { a: -54, l: 13 }], cara: { ojos: 'felices' } }),
  // 2 despega: estirado hacia arriba
  conejo({ dx: DX, cola: [16, 54], cuerpo: [27, 44, 13.5, 7, -42], muslo: [20, 51, 6, 5.5, -40], pataT: [16, 58, 22, 58], pataDlejos: [[36, 38, 41, 37]], pataD: [[38, 40, 44, 40]], cabeza: [38, 29], orejas: [{ a: -80, l: 13 }, { a: -64, l: 13 }], cara: { ojos: 'felices' } }),
  // 3 sube, patas atrás colgando
  conejo({ dx: DX, cola: [15, 50], cuerpo: [27, 44, 13, 7, -30], muslo: [19, 49, 6, 5.5, -20], pataT: [17, 52, 14, 58, 1.6], pataT2: [20, 53, 19, 57, 1.6], pataDlejos: [[37, 41, 42, 42]], pataD: [[39, 43, 45, 45]], cabeza: [39, 32], orejas: [{ a: -120, l: 13 }, { a: -104, l: 13 }], cara: { ojos: 'felices', boca: 'abierta' } }),
  // 4 empieza el giro: la cabeza mira atrás, patea
  conejo({ dx: 5, cola: [13, 46], cuerpo: [27, 46, 12, 8, -8], muslo: [19, 47, 6, 5.5], pataT: [14, 50, 7, 51, 1.6], pataT2: [15, 53, 9, 57, 1.6], pataDlejos: [[36, 52, 39, 56]], pataD: [[38, 52, 42, 55]], cabeza: [36, 36], orejas: [{ a: 62, l: 13 }, { a: 84, l: 13 }], cara: { mira: -1, ojos: 'felices', boca: 'abierta' } }),
  // 5 cúspide: girado del todo, patas al cielo
  giro,
  // 6 baja, de vuelta al frente
  conejo({ dx: DX, cola: [14, 43], cuerpo: [27, 46, 13, 7.5, 20], muslo: [19, 45, 6, 5.5, 20], pataT: [12, 46, 17, 50], pataDlejos: [[38, 52, 41, 58]], pataD: [[40, 52, 44, 58]], cabeza: [41, 42], orejas: [{ a: -24, l: 13 }, { a: -8, l: 13 }], cara: { ojos: 'felices' } }),
  // 7 aterriza aplastado
  conejo({ dx: DX, cola: [14, 52], cuerpo: [27, 52, 13.5, 7.5], muslo: [22, 54, 7, 5.5], pataT: [21, 58, 31, 58], pataDlejos: [[37, 54, 38, 58]], pataD: [[40, 54, 43, 58]], cabeza: [38, 44], orejas: [{ a: -10, l: 8, a2: 40, l2: 5 }, { a: 8, l: 8, a2: 58, l2: 5 }], cara: { ojos: 'apretados' } }),
  S({}),
] }

// --- reaccion: se para en dos patas, orejas tiesas ---
const parado = (h, o = {}) => conejo(mezcla({ dx: DX, cola: [19, 54], cuerpo: [28, 46 - h / 2, 8.5, 13 + h / 2], muslo: [26, 53, 6.5, 6], pataT: [24, 58, 34, 58], pataDlejos: [[33, 39 - h, 37, 42 - h, 1.4]], pataD: [[35, 40 - h, 39, 44 - h, 1.4]], cabeza: [32, 29 - h], orejas: [{ a: -3, l: 11 }, { a: 3, l: 11 }], cara: { ojos: 'grandes' } }, o))
anim.reaccion = { dur: [70, 140, 200, 110, 200], bucle: false, fijo: 2, cuadros: [
  S({ cuerpo: [27, 49, 11, 10], cabeza: [35, 35], orejas: [{ a: -34, l: 13 }, { a: -20, l: 13 }], cara: { ojos: 'grandes' } }),
  parado(1.5, { orejas: [{ a: -6, l: 11 }, { a: 6, l: 11 }] }),
  parado(0),
  S({ cuerpo: [27, 47, 10, 12], cabeza: [34, 31], orejas: [{ a: -4, l: 12 }, { a: 10, l: 12 }], pataD: [[37, 46, 38, 55]], pataDlejos: [[34, 47, 35, 56]] }),
  S({}),
] }

if (process.argv[2] === 'ver') {
  const cuales = process.argv[3] ? process.argv[3].split(',') : Object.keys(anim)
  const todos = cuales.flatMap((n) => anim[n].cuadros)
  contacto('ver-conejito.png', todos, Number(process.argv[4] ?? 6), Number(process.argv[5] ?? 4))
  for (const n of cuales) console.log(n, anim[n].cuadros.map((c, i) => { const b = c.caja(); return `${i}:x${b.x0}-${b.x1} y${b.y0}-${b.y1}` }).join(' | '))
}
if (process.argv[2] === 'ascii') console.log(anim[process.argv[3]].cuadros[Number(process.argv[4])].ascii())
