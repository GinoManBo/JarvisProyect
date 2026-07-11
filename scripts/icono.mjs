// Dibuja build/icon.png sin dependencias: una hoja con la regla del margen.
// Ejecutar sólo si quieres regenerar el ícono: node scripts/icono.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const N = 1024
const PAPEL = [250, 249, 246]
const AZUL = [43, 58, 140]
const ROSA = [246, 194, 214]
const TINTA = [22, 24, 29]

const lienzo = new Uint8Array(N * N * 3)
const pintar = (x, y, [r, g, b]) => {
  const i = (y * N + x) * 3
  lienzo[i] = r
  lienzo[i + 1] = g
  lienzo[i + 2] = b
}

// Fondo azul, hoja de papel encima. Los trazos son gruesos a propósito: a 64 px
// en el Dock, cualquier línea fina se borra.
const HOJA = { x0: 128, y0: 128, x1: 896, y1: 896 }
const REGLA_X = 248
const TEXTO_X = 320
const RENGLONES = [
  { y: 258, x1: 812, color: TINTA, alto: 58 },
  { y: 396, x1: 760, color: TINTA, alto: 40 },
  { y: 486, x1: 830, color: AZUL, alto: 40 },
  { y: 576, x1: 700, color: TINTA, alto: 40 },
  { y: 666, x1: 790, color: TINTA, alto: 40 },
]

for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const enHoja = x >= HOJA.x0 && x < HOJA.x1 && y >= HOJA.y0 && y < HOJA.y1
    pintar(x, y, enHoja ? PAPEL : AZUL)
  }
}

// La regla del margen.
for (let y = HOJA.y0; y < HOJA.y1; y++) {
  for (let x = REGLA_X; x < REGLA_X + 12; x++) pintar(x, y, ROSA)
}

// Los renglones escritos, siempre a la derecha de la regla.
for (const r of RENGLONES) {
  for (let y = r.y; y < r.y + r.alto; y++) {
    for (let x = TEXTO_X; x < r.x1; x++) pintar(x, y, r.color)
  }
}

// PNG truecolor, sin filtros por fila.
const crudo = Buffer.alloc(N * (N * 3 + 1))
for (let y = 0; y < N; y++) {
  crudo[y * (N * 3 + 1)] = 0
  Buffer.from(lienzo.buffer, y * N * 3, N * 3).copy(crudo, y * (N * 3 + 1) + 1)
}

const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return (buf) => {
    let c = -1
    for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ -1) >>> 0
  }
})()

const trozo = (tipo, datos) => {
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(CRC(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(N, 0)
ihdr.writeUInt32BE(N, 4)
ihdr[8] = 8 // bits
ihdr[9] = 2 // truecolor

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  trozo('IHDR', ihdr),
  trozo('IDAT', deflateSync(crudo, { level: 9 })),
  trozo('IEND', Buffer.alloc(0)),
])

mkdirSync('build', { recursive: true })
writeFileSync('build/icon.png', png)
console.log(`build/icon.png — ${N}x${N}, ${(png.length / 1024).toFixed(0)} kB`)
