import { deflateSync, inflateSync } from 'node:zlib'
import { writeFileSync, readFileSync } from 'node:fs'
export const PAL = { B: '#2b3a8c', C: '#ffe17a', D: '#f5c443', E: '#d9913a', F: '#fffaf0', G: '#d9d6ea', H: '#f6c2d6', I: '#9a6238' }
const N = 64
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const rad = (g) => (g * Math.PI) / 180

export class Parte {
  constructor() { this.p = new Array(N * N).fill('.') }
  get(x, y) { return x < 0 || y < 0 || x >= N || y >= N ? '.' : this.p[y * N + x] }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) this.p[y * N + x] = c; return this }
  cada(fn) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) fn(x, y) }
  /** elipse, rot en grados (positivo = sentido horario en pantalla) */
  elipse(cx, cy, rx, ry, c, rot = 0, solo = null) {
    const co = Math.cos(rad(rot)), si = Math.sin(rad(rot))
    this.cada((x, y) => {
      const dx = x - cx, dy = y - cy
      const u = dx * co + dy * si, v = -dx * si + dy * co
      if ((u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1 && (!solo || solo(x, y))) this.p[y * N + x] = c
    })
    return this
  }
  capsula(x0, y0, x1, y1, r, c, solo = null) {
    const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy
    this.cada((x, y) => {
      let t = l2 ? ((x - x0) * vx + (y - y0) * vy) / l2 : 0
      t = Math.max(0, Math.min(1, t))
      const dx = x - (x0 + t * vx), dy = y - (y0 + t * vy)
      if (dx * dx + dy * dy <= r * r && (!solo || solo(x, y))) this.p[y * N + x] = c
    })
    return this
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this }
  linea(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let e = dx + dy
    for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx } if (e2 <= dx) { e += dx; y0 += sy } }
    return this
  }
  /** quita los picos de 1 px (puntas de elipse) */
  pulir() {
    const src = this.p.slice(), at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? '.' : src[y * N + x])
    this.cada((x, y) => { if (at(x, y) === '.') return; const n = (at(x - 1, y) !== '.') + (at(x + 1, y) !== '.') + (at(x, y - 1) !== '.') + (at(x, y + 1) !== '.'); if (n <= 1) this.p[y * N + x] = '.' })
    return this
  }
  /** sólo donde ya hay relleno (manchas) */
  dentro() { const m = this.p.slice(); return (x, y) => m[y * N + x] !== '.' }
  /** sombra en el borde abajo-derecha */
  sombra(mapa, g = 1) {
    const src = this.p.slice(), at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? '.' : src[y * N + x])
    this.cada((x, y) => {
      const c = at(x, y)
      if (!mapa[c]) return
      let s = false
      for (let k = 1; k <= g; k++) if (at(x + k, y) === '.' || at(x, y + k) === '.' ) s = true
      if (at(x + 1, y + 1) === '.') s = true
      if (s) this.p[y * N + x] = mapa[c]
    })
    return this
  }
  /** compone sobre el lienzo. modo: 'completo' | 'silueta' | 'ninguno' */
  sobre(L, modo = 'completo') {
    this.cada((x, y) => {
      const c = this.p[y * N + x]
      if (c !== '.') { L.p[y * N + x] = c; return }
      if (modo === 'ninguno') return
      const toca = this.get(x - 1, y) !== '.' || this.get(x + 1, y) !== '.' || this.get(x, y - 1) !== '.' || this.get(x, y + 1) !== '.'
      if (toca && (modo === 'completo' || L.p[y * N + x] === '.')) L.p[y * N + x] = 'B'
    })
    return L
  }
  /** pega arte ASCII ('.' transparente, ' ' = no tocar) */
  sello(x, y, filas, borra = false) {
    filas.forEach((f, j) => [...f].forEach((ch, i) => { if (ch === ' ') return; if (ch !== '.' || borra) this.set(x + i, y + j, ch) }))
    return this
  }
  espejo() { const q = new Parte(); this.cada((x, y) => { q.p[y * N + (N - 1 - x)] = this.p[y * N + x] }); this.p = q.p; return this }
  mover(dx, dy) { const q = new Parte(); this.cada((x, y) => { const c = this.p[y * N + x]; if (c !== '.') q.set(x + dx, y + dy, c) }); this.p = q.p; return this }
  caja() { let x0 = N, x1 = -1, y0 = N, y1 = -1; this.cada((x, y) => { if (this.p[y * N + x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) } }); return { x0, x1, y0, y1 } }
  ascii() { const o = []; for (let y = 0; y < N; y++) o.push(String(y).padStart(2) + ' ' + this.p.slice(y * N, y * N + N).join('')); return o.join('\n') }
}

const tablaCrc = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = (b) => { let c = ~0; for (const v of b) c = tablaCrc[(c ^ v) & 255] ^ (c >>> 8); return ~c >>> 0 }
export function escribirPng(ruta, w, h, rgba) {
  const trozo = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'latin1'); d.copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + d.length)), 8 + d.length); return b }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6
  const crudo = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) rgba.copy(crudo, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  writeFileSync(ruta, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]), trozo('IHDR', ih), trozo('IDAT', deflateSync(crudo)), trozo('IEND', Buffer.alloc(0))]))
}
export function leerPng(ruta) {
  const b = readFileSync(ruta); let o = 8, ih; const id = []
  while (o < b.length) { const n = b.readUInt32BE(o), t = b.toString('latin1', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + n); if (t === 'IHDR') ih = d; else if (t === 'IDAT') id.push(d); o += 12 + n }
  const w = ih.readUInt32BE(0), h = ih.readUInt32BE(4), raw = inflateSync(Buffer.concat(id)), st = w * 4, img = Buffer.alloc(st * h)
  for (let y = 0; y < h; y++) { const f = raw[y * (st + 1)]; for (let x = 0; x < st; x++) { const v = raw[y * (st + 1) + 1 + x], a = x >= 4 ? img[y * st + x - 4] : 0, u = y ? img[(y - 1) * st + x] : 0, c = x >= 4 && y ? img[(y - 1) * st + x - 4] : 0; let p = 0; if (f === 1) p = a; else if (f === 2) p = u; else if (f === 3) p = (a + u) >> 1; else if (f === 4) { const pp = a + u - c, pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? u : c } img[y * st + x] = (v + p) & 255 } }
  return { w, h, img }
}
/** cuadros de un png tira → Partes (por color exacto) */
export function tiraAPartes(ruta) {
  const { w, img } = leerPng(ruta); const inv = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [v, k])); const out = []
  for (let i = 0; i < w / N; i++) { const p = new Parte(); p.cada((x, y) => { const q = (y * w + i * N + x) * 4; if (img[q + 3]) { const h = '#' + [img[q], img[q + 1], img[q + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''); p.p[y * N + x] = inv[h] ?? '?' } }); out.push(p) }
  return out
}
/** tira 1:1 transparente (para Aseprite) */
export function tira(ruta, cuadros) {
  const w = N * cuadros.length, buf = Buffer.alloc(w * N * 4)
  cuadros.forEach((L, i) => L.cada((x, y) => { const c = L.p[y * N + x]; if (c === '.') return; const [r, g, b] = rgb(PAL[c]); const q = (y * w + i * N + x) * 4; buf[q] = r; buf[q + 1] = g; buf[q + 2] = b; buf[q + 3] = 255 }))
  escribirPng(ruta, w, N, buf)
}
/** hoja de contacto ampliada con fondo, para mirar */
export function contacto(ruta, cuadros, cols = 6, esc = 3, fondo = [60, 62, 74]) {
  const filas = Math.ceil(cuadros.length / cols), w = cols * N * esc, h = filas * N * esc, buf = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) { const cx = Math.floor((i % w) / (N * esc)), cy = Math.floor(Math.floor(i / w) / (N * esc)); const f = (cx + cy) % 2 ? fondo : fondo.map((v) => v + 10); buf[i * 4] = f[0]; buf[i * 4 + 1] = f[1]; buf[i * 4 + 2] = f[2]; buf[i * 4 + 3] = 255 }
  cuadros.forEach((L, k) => { const ox = (k % cols) * N * esc, oy = Math.floor(k / cols) * N * esc
    // línea de suelo y=60
    for (let x = 0; x < N * esc; x++) { const q = ((oy + 61 * esc) * w + ox + x) * 4; buf[q] = 90; buf[q + 1] = 92; buf[q + 2] = 110 }
    L.cada((x, y) => { const c = L.p[y * N + x]; if (c === '.') return; const [r, g, b] = rgb(PAL[c]); for (let j = 0; j < esc; j++) for (let i = 0; i < esc; i++) { const q = ((oy + y * esc + j) * w + ox + x * esc + i) * 4; buf[q] = r; buf[q + 1] = g; buf[q + 2] = b } }) })
  escribirPng(ruta, w, h, buf)
}
