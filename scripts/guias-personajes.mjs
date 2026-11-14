// Genera las HOJAS GUÍA de los personajes a partir de los manifiestos.
//
// NO es arte: es la plantilla técnica que ocupa el lugar del arte hasta que
// lleguen las ilustraciones reales. Cada cuadro lleva borde de celda, línea de
// suelo, cruz del ancla, caja segura, el número de cuadro y una "sonda" que se
// desplaza con el cuadro — suficiente para comprobar en el demo el orden, los
// tiempos, la transparencia, el escalado y que nada salta. El artista reemplaza
// estos mismos archivos (mismo nombre, mismas dimensiones).
//
// Uso:  node scripts/guias-personajes.mjs [--forzar]
// Sin --forzar no pisa un PNG que ya no sea una guía (detecta la marca tEXt).
import { deflateSync } from 'node:zlib'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'recursos', 'personajes')
const FORZAR = process.argv.includes('--forzar')
const MARCA = 'GUIA-NO-ES-ARTE'

// --- PNG RGBA mínimo ---------------------------------------------------------
const TABLA = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (b) => {
  let c = 0xffffffff
  for (const x of b) c = TABLA[(c ^ x) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const trozo = (tipo, datos) => {
  const t = Buffer.from(tipo, 'latin1')
  const d = Buffer.from(datos)
  const n = Buffer.alloc(4)
  n.writeUInt32BE(d.length)
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc(Buffer.concat([t, d])))
  return Buffer.concat([n, t, d, c])
}
function png(ancho, alto, rgba) {
  const filas = Buffer.alloc((ancho * 4 + 1) * alto)
  for (let y = 0; y < alto; y++) {
    filas[y * (ancho * 4 + 1)] = 0
    Buffer.from(rgba.buffer, y * ancho * 4, ancho * 4).copy(filas, y * (ancho * 4 + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0)
  ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8
  ihdr[9] = 6 // RGBA, alfa recto (no premultiplicado)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    trozo('IHDR', ihdr),
    trozo('tEXt', Buffer.from(`Comment\0${MARCA}`, 'latin1')),
    trozo('IDAT', deflateSync(filas, { level: 9 })),
    trozo('IEND', []),
  ])
}

// --- Fuente 5x7 de dígitos ---------------------------------------------------
const DIG = {
  0: '01110 10001 10011 10101 11001 10001 01110',
  1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00010 00100 01000 11111',
  3: '11110 00001 00001 01110 00001 00001 11110',
  4: '00010 00110 01010 10010 11111 00010 00010',
  5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110',
  7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110',
  9: '01110 10001 10001 01111 00001 00010 01100',
}

// --- Lienzo de una hoja -------------------------------------------------------
class Lienzo {
  constructor(a, h) {
    this.a = a
    this.h = h
    this.px = new Uint8ClampedArray(a * h * 4)
  }
  punto(x, y, [r, g, b, al]) {
    if (x < 0 || y < 0 || x >= this.a || y >= this.h) return
    const i = (Math.round(y) * this.a + Math.round(x)) * 4
    this.px[i] = r
    this.px[i + 1] = g
    this.px[i + 2] = b
    this.px[i + 3] = al
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.punto(x + i, y + j, c)
  }
  marco(x, y, w, h, grosor, c) {
    this.rect(x, y, w, grosor, c)
    this.rect(x, y + h - grosor, w, grosor, c)
    this.rect(x, y, grosor, h, c)
    this.rect(x + w - grosor, y, grosor, h, c)
  }
  numero(n, x, y, escala, c) {
    let cx = x
    for (const d of String(n)) {
      DIG[d].split(' ').forEach((fila, j) =>
        [...fila].forEach((v, i) => v === '1' && this.rect(cx + i * escala, y + j * escala, escala, escala, c)),
      )
      cx += 6 * escala
    }
  }
}

const COLOR = {
  celda: [255, 0, 170, 200],
  suelo: [0, 190, 255, 230],
  ancla: [0, 190, 255, 255],
  caja: [120, 120, 120, 150],
  numero: [255, 0, 170, 255],
  dur: [90, 90, 90, 255],
  sonda: [255, 170, 0, 255],
  cubre: [230, 40, 40, 255],
  libera: [40, 190, 80, 255],
}

/** Dibuja un cuadro-guía dentro de la hoja en (ox, oy) con celda de `px`. */
function cuadro(L, ox, oy, px, i, total, ms, marcas) {
  const k = px / 128 // unidades lógicas → píxeles
  const g = Math.max(1, Math.round(px / 128))
  const U = (v) => Math.round(v * k)
  L.marco(ox, oy, px, px, g, COLOR.celda)
  L.marco(ox + U(24), oy + U(28), U(80), U(92), g, COLOR.caja) // caja segura del personaje
  L.rect(ox, oy + U(120), px, g, COLOR.suelo) // suelo: y = 120
  L.rect(ox + U(64) - g, oy + U(120) - U(6), g * 2, U(12), COLOR.ancla) // ancla: x = 64
  L.rect(ox + U(64) - U(6), oy + U(120) - g, U(12), g * 2, COLOR.ancla)
  const esc = Math.max(1, Math.round(px / 32))
  L.numero(i, ox + U(64) - Math.round((String(i).length * 6 * esc - esc) / 2), oy + U(52), esc, COLOR.numero)
  const e2 = Math.max(1, Math.round(px / 64))
  L.numero(ms, ox + U(64) - Math.round((String(ms).length * 6 * e2 - e2) / 2), oy + U(96), e2, COLOR.dur)
  // La sonda recorre la caja segura con el cuadro: si el orden o el tiempo fallan, se ve.
  const t = total > 1 ? i / (total - 1) : 0
  const s = U(8)
  L.rect(ox + U(24) + Math.round(t * (U(80) - s)), oy + U(120) - s - 2 * g, s, s, COLOR.sonda)
  if (marcas?.cubre === i) L.rect(ox + g, oy + g, U(40), U(6), COLOR.cubre)
  if (marcas?.libera === i) L.rect(ox + px - g - U(40), oy + g, U(40), U(6), COLOR.libera)
}

function escribir(ruta, buf) {
  if (existsSync(ruta) && !FORZAR && !readFileSync(ruta).includes(MARCA)) {
    console.log(`  respeta (arte real): ${ruta}`)
    return
  }
  mkdirSync(dirname(ruta), { recursive: true })
  writeFileSync(ruta, buf)
  console.log(`  guía: ${ruta.replace(RAIZ + '/', '')}`)
}

for (const animal of readdirSync(RAIZ, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const estilo of readdirSync(join(RAIZ, animal.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const dir = join(RAIZ, animal.name, estilo.name)
    const ruta = join(dir, 'manifiesto.json')
    if (!existsSync(ruta)) continue
    const m = JSON.parse(readFileSync(ruta, 'utf8'))
    const px = m.celdaPx
    console.log(`${animal.name}/${estilo.name}`)
    for (const [nombre, a] of Object.entries(m.animaciones)) {
      const f = a.fuente
      const orden = a.orden ?? Array.from({ length: f.cuadros }, (_, i) => i)
      // Duración mostrada de cada cuadro dibujado = la de su primera aparición.
      const ms = (c) => a.duraciones[orden.indexOf(c)] ?? 0
      // Las marcas están en PASOS; en la guía se señalan sobre el cuadro de ese paso.
      const marcas = a.marcas && Object.fromEntries(Object.entries(a.marcas).map(([k, p]) => [k, orden[p]]))
      if (f.tipo === 'hoja') {
        const filas = Math.ceil(f.cuadros / f.columnas)
        const L = new Lienzo(f.columnas * px, filas * px)
        for (let i = 0; i < f.cuadros; i++)
          cuadro(L, (i % f.columnas) * px, Math.floor(i / f.columnas) * px, px, i, f.cuadros, ms(i), marcas)
        escribir(join(dir, f.archivo), png(L.a, L.h, L.px))
      } else {
        for (let i = 0; i < f.cuadros; i++) {
          const L = new Lienzo(px, px)
          cuadro(L, 0, 0, px, i, f.cuadros, ms(i), marcas)
          escribir(join(dir, f.patron.replace('{n}', String(i).padStart(f.digitos, '0'))), png(px, px, L.px))
        }
      }
    }
  }
}
