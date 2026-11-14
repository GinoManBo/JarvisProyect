// Valida los recursos de personajes contra recursos/personajes/ESPECIFICACION.md.
// Uso: node scripts/validar-personajes.mjs        (sale con código 1 si hay errores)
// Las hojas GUÍA (marca tEXt) pasan las comprobaciones de formato pero no las de arte.
import { inflateSync } from 'node:zlib'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'recursos', 'personajes')
const ANCLA_Y = 120 // de 128
let errores = 0
let avisos = 0
const err = (m) => (errores++, console.log(`  ✗ ${m}`))
const aviso = (m) => (avisos++, console.log(`  ! ${m}`))

function leerPng(ruta) {
  const b = readFileSync(ruta)
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('no es PNG')
  let o = 8
  let ihdr
  const idat = []
  let guia = false
  while (o < b.length) {
    const n = b.readUInt32BE(o)
    const t = b.toString('latin1', o + 4, o + 8)
    const d = b.subarray(o + 8, o + 8 + n)
    if (t === 'IHDR') ihdr = d
    else if (t === 'IDAT') idat.push(d)
    else if (t === 'tEXt' && d.includes('GUIA-NO-ES-ARTE')) guia = true
    o += 12 + n
  }
  const w = ihdr.readUInt32BE(0)
  const h = ihdr.readUInt32BE(4)
  return { w, h, prof: ihdr[8], color: ihdr[9], entrelazado: ihdr[12], guia, idat: Buffer.concat(idat) }
}

/** Desfiltra un PNG RGBA de 8 bits y devuelve solo el canal alfa por píxel. */
function alfa({ w, h, idat }) {
  const crudo = inflateSync(idat)
  const paso = w * 4
  const img = Buffer.alloc(paso * h)
  for (let y = 0; y < h; y++) {
    const f = crudo[y * (paso + 1)]
    for (let x = 0; x < paso; x++) {
      const v = crudo[y * (paso + 1) + 1 + x]
      const a = x >= 4 ? img[y * paso + x - 4] : 0
      const u = y ? img[(y - 1) * paso + x] : 0
      const c = x >= 4 && y ? img[(y - 1) * paso + x - 4] : 0
      let p = 0
      if (f === 1) p = a
      else if (f === 2) p = u
      else if (f === 3) p = (a + u) >> 1
      else if (f === 4) {
        const pp = a + u - c
        const pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - c)
        p = pa <= pb && pa <= pc ? a : pb <= pc ? u : c
      }
      img[y * paso + x] = (v + p) & 255
    }
  }
  const al = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) al[i] = img[i * 4 + 3]
  return al
}

function celdas(f, px) {
  return f.tipo === 'hoja'
    ? [{ ruta: f.archivo, w: f.columnas * px, h: Math.ceil(f.cuadros / f.columnas) * px, n: f.cuadros, cols: f.columnas }]
    : Array.from({ length: f.cuadros }, (_, i) => ({
        ruta: f.patron.replace('{n}', String(i).padStart(f.digitos, '0')),
        w: px, h: px, n: 1, cols: 1,
      }))
}

for (const animal of readdirSync(RAIZ, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const est of readdirSync(join(RAIZ, animal.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const dir = join(RAIZ, animal.name, est.name)
    const ruta = join(dir, 'manifiesto.json')
    if (!existsSync(ruta)) continue
    console.log(`${animal.name}/${est.name}`)
    const m = JSON.parse(readFileSync(ruta, 'utf8'))
    const px = m.celdaPx

    if (m.animal !== animal.name || m.estilo !== est.name) err('animal/estilo del manifiesto no coincide con la carpeta')
    if (!(128 % px === 0 || px % 128 === 0)) err(`celdaPx ${px} debe dividir o ser múltiplo de 128`)
    if (m.render === 'pixelado' && (px > 128 || 128 % px)) err('pixel art: celdaPx debe dividir 128 (64, 32…)')
    for (const nombre of ['reposo', 'dormir', 'caminar', 'poof']) if (!m.animaciones[nombre]) err(`falta la animación ${nombre}`)

    for (const [nombre, a] of Object.entries(m.animaciones)) {
      const f = a.fuente
      const n = (a.orden ?? Array.from({ length: f.cuadros })).length
      if (a.duraciones.length !== n) err(`${nombre}: ${a.duraciones.length} duraciones para ${n} pasos`)
      if (a.duraciones.some((d) => !(d >= 16))) err(`${nombre}: duración menor a 16 ms (un fotograma de pantalla)`)
      if (a.orden?.some((c) => !Number.isInteger(c) || c < 0 || c >= f.cuadros)) err(`${nombre}: orden fuera de rango`)
      if (a.fijo != null && !(a.fijo >= 0 && a.fijo < n)) err(`${nombre}: fijo fuera de rango`)
      if (!a.bucle && nombre !== 'poof') aviso(`${nombre}: sin bucle y sin destino; hoy sólo poof es de una pasada`)
      if (nombre === 'poof') {
        const { cubre, libera } = a.marcas ?? {}
        if (cubre == null || libera == null) err('poof: faltan marcas cubre/libera')
        else if (!(cubre < libera && libera < n)) err('poof: se exige cubre < libera < pasos')
        if (a.bucle) err('poof no puede ser bucle')
      }

      for (const c of celdas(f, px)) {
        const archivo = join(dir, c.ruta)
        if (!existsSync(archivo)) { err(`falta ${c.ruta}`); continue }
        let p
        try { p = leerPng(archivo) } catch (e) { err(`${c.ruta}: ${e.message}`); continue }
        if (p.prof !== 8 || p.color !== 6) err(`${c.ruta}: debe ser RGBA de 8 bits (es prof ${p.prof}, tipo ${p.color})`)
        if (p.entrelazado) err(`${c.ruta}: sin entrelazado`)
        if (p.w !== c.w || p.h !== c.h) { err(`${c.ruta}: mide ${p.w}×${p.h}, debe medir ${c.w}×${c.h}`); continue }
        if (p.guia || p.prof !== 8 || p.color !== 6) continue // guías: sólo formato

        // Comprobaciones de arte por cuadro: recorte, apoyo y fondo transparente.
        const al = alfa(p)
        for (let i = 0; i < c.n; i++) {
          const ox = (i % c.cols) * px, oy = Math.floor(i / c.cols) * px
          let borde = 0, base = -1, opacos = 0
          for (let y = 0; y < px; y++)
            for (let x = 0; x < px; x++) {
              const v = al[(oy + y) * p.w + ox + x]
              if (v > 8) { opacos++; if (x === 0 || y === 0 || x === px - 1 || y === px - 1) borde++; base = Math.max(base, y) }
            }
          const id = c.n > 1 ? `${c.ruta}[${i}]` : c.ruta
          if (!opacos) { aviso(`${id}: cuadro vacío`); continue }
          if (opacos === px * px) err(`${id}: sin transparencia (fondo opaco)`)
          if (borde) err(`${id}: el dibujo toca el borde de la celda (${borde} px) — se recorta`)
          if (nombre !== 'poof') {
            const sueloPx = (ANCLA_Y / 128) * px
            if (base < sueloPx - 0.06 * px) aviso(`${id}: nada apoya cerca del suelo (último píxel en y=${base}, suelo ${sueloPx})`)
            if (base > sueloPx + 0.04 * px) aviso(`${id}: se pasa del suelo (y=${base} > ${sueloPx})`)
          }
        }
      }
    }
  }
}
console.log(`\n${errores} error(es), ${avisos} aviso(s)`)
process.exit(errores ? 1 : 0)
