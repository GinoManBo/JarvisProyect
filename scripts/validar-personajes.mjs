// Valida los recursos de personajes contra recursos/personajes/ESPECIFICACION.md.
// Uso: node scripts/validar-personajes.mjs        (sale con código 1 si hay errores)
// Las hojas GUÍA (marca tEXt) pasan las comprobaciones de formato pero no las de arte.
import { inflateSync } from 'node:zlib'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'recursos', 'personajes')
const ANCLA_Y = 120 // de 128 (y = 60 en la celda de 64)
const AGARRE_Y = 8 / 64 // punto de agarre de `colgar`: (32, 8) en la celda de 64
const BASE = ['reposo', 'dormir', 'caminar'] // obligatorias
const JUEGO = ['colgar', 'caer', 'jugar', 'reaccion'] // opcionales (contrato .ui-pipeline/05-monitos-juego.md)
const GATO = ['trepar', 'voltereta', 'tendido'] // opcionales, hoy sólo del gatito (ampliación del contrato)
const AGARRE_TREPAR_Y = 6 / 64 // `trepar`: las patas delanteras, (32, 6), van en el borde del marco
const APPA = ['planear', 'virar', 'despertar', 'despegar'] // opcionales, hoy sólo de Appa (§6 del contrato)
const MARCA_APPA = { virar: 'giro', despegar: 'impulso' } // la marca que el motor espera en cada una
const UNA_PASADA = ['caer', 'jugar', 'reaccion', 'tendido', 'virar', 'despertar', 'despegar', 'poof']
const CONOCIDAS = [...BASE, ...JUEGO, ...GATO, ...APPA, 'poof']
const mediana = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
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
    for (const nombre of BASE) if (!m.animaciones[nombre]) err(`falta la animación ${nombre}`)
    if (!m.animaciones.poof) aviso('sin poof: no podrá transformarse a este estilo con nube')
    const faltan = JUEGO.filter((n) => !m.animaciones[n])
    if (faltan.length) aviso(`sin ${faltan.join(', ')}: el motor muestra reposo en su lugar`)
    const faltanGato = GATO.filter((n) => !m.animaciones[n])
    if (animal.name === 'gatito' && m.render === 'pixelado' && faltanGato.length)
      aviso(`sin ${faltanGato.join(', ')}: el motor pone suplentes (trepar→colgar, voltereta→colgar, tendido→reposo)`)
    const faltanAppa = APPA.filter((n) => !m.animaciones[n])
    if (animal.name === 'appa' && m.render === 'pixelado' && faltanAppa.length)
      aviso(`sin ${faltanAppa.join(', ')}: el motor pone suplentes (planear→caminar, virar→planear, despertar/despegar→reposo)`)
    const lomo = {} // altura del lomo por animación, para RASGOS.lomo del motor

    for (const [nombre, a] of Object.entries(m.animaciones)) {
      const f = a.fuente
      const n = (a.orden ?? Array.from({ length: f.cuadros })).length
      if (a.duraciones.length !== n) err(`${nombre}: ${a.duraciones.length} duraciones para ${n} pasos`)
      if (a.duraciones.some((d) => !(d >= 16))) err(`${nombre}: duración menor a 16 ms (un fotograma de pantalla)`)
      if (a.orden?.some((c) => !Number.isInteger(c) || c < 0 || c >= f.cuadros)) err(`${nombre}: orden fuera de rango`)
      if (a.fijo != null && !(a.fijo >= 0 && a.fijo < n)) err(`${nombre}: fijo fuera de rango`)
      if (!CONOCIDAS.includes(nombre)) aviso(`${nombre}: animación desconocida, nadie la reproduce`)
      else if (UNA_PASADA.includes(nombre) ? a.bucle : !a.bucle)
        err(`${nombre}: debe ser ${UNA_PASADA.includes(nombre) ? 'de una pasada (bucle: false)' : 'bucle'}`)
      if (nombre === 'jugar') {
        const impacto = a.marcas?.impacto
        if (impacto == null) aviso('jugar: sin marca impacto; el motor la supone al 60 % de la jugada')
        else if (!(Number.isInteger(impacto) && impacto >= 0 && impacto < n)) err('jugar: marca impacto fuera de rango')
      }
      if (MARCA_APPA[nombre]) {
        const marca = a.marcas?.[MARCA_APPA[nombre]]
        if (marca == null) aviso(`${nombre}: sin marca ${MARCA_APPA[nombre]}; el motor supone un tiempo`)
        else if (!(Number.isInteger(marca) && marca >= 0 && marca < n)) err(`${nombre}: marca ${MARCA_APPA[nombre]} fuera de rango`)
      }
      // Pixel: una sola fila por hoja. Las nuevas la exigen; las heredadas avisan.
      if (m.render === 'pixelado' && f.tipo === 'hoja' && f.columnas !== f.cuadros && nombre !== 'poof') {
        if (JUEGO.includes(nombre) || GATO.includes(nombre) || APPA.includes(nombre)) err(`${nombre}: la hoja debe ser de una sola fila (columnas = cuadros)`)
        else aviso(`${nombre}: hoja heredada de varias filas (${f.columnas} columnas, ${f.cuadros} cuadros); el contrato nuevo pide una fila`)
      }
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
          let borde = 0, base = -1, tope = px, opacos = 0
          const topes = [] // por columna, la primera fila con dibujo
          for (let y = 0; y < px; y++)
            for (let x = 0; x < px; x++) {
              const v = al[(oy + y) * p.w + ox + x]
              if (v > 8) { opacos++; if (x === 0 || y === 0 || x === px - 1 || y === px - 1) borde++; base = Math.max(base, y); tope = Math.min(tope, y); topes[x] = Math.min(topes[x] ?? px, y) }
            }
          const id = c.n > 1 ? `${c.ruta}[${i}]` : c.ruta
          if (!opacos) { aviso(`${id}: cuadro vacío`); continue }
          if (opacos === px * px) err(`${id}: sin transparencia (fondo opaco)`)
          if (borde) err(`${id}: el dibujo toca el borde de la celda (${borde} px) — se recorta`)
          const sueloPx = (ANCLA_Y / 128) * px
          if (m.render === 'pixelado' && (nombre === 'reposo' || nombre === 'dormir')) {
            // El lomo: en reposo, la mitad trasera (mira a +x, la cabeza va adelante);
            // dormido, el centro del ovillo. Mediana de la silueta, sin orejas ni cola.
            const xs = Object.keys(topes).map(Number)
            const x0 = Math.min(...xs), x1 = Math.max(...xs)
            const zona = xs.filter((x) => (nombre === 'reposo' ? x > x0 + 2 && x < (x0 + x1) / 2 : Math.abs(x - (x0 + x1) / 2) <= (x1 - x0) / 4))
            if (zona.length) (lomo[nombre] ??= []).push((sueloPx - mediana(zona.map((x) => topes[x]))) / px)
          }
          if (nombre === 'trepar') {
            const agarre = AGARRE_TREPAR_Y * px
            if (tope > agarre + 0.06 * px) aviso(`${id}: las patas no llegan al borde (primer píxel en y=${tope}, agarre ${agarre})`)
          } else if (nombre === 'voltereta' || nombre === 'planear' || nombre === 'virar') {
            // En el aire (la voltereta gira alrededor de (32, 34); Appa planea y vira): no se les pide suelo.
            if (base > sueloPx + 0.04 * px) aviso(`${id}: se pasa del suelo (y=${base} > ${sueloPx})`)
          } else if (nombre === 'colgar') {
            // Cuelga del punto de agarre: el dibujo debe empezar cerca de él, no del suelo.
            const agarre = AGARRE_Y * px
            if (tope > agarre + 0.12 * px) aviso(`${id}: empieza lejos del punto de agarre (primer píxel en y=${tope}, agarre ${agarre})`)
          } else if (nombre !== 'poof') {
            // En jugar y reaccion hay cuadros en el aire (saltos): sólo se exige no pasarse.
            // …y en despegar, los cuadros desde la marca `impulso` ya van en el aire.
            const aerea = nombre === 'jugar' || nombre === 'reaccion' || (nombre === 'despegar' && i >= (a.marcas?.impulso ?? 0))
            if (!aerea && base < sueloPx - 0.06 * px) aviso(`${id}: nada apoya cerca del suelo (último píxel en y=${base}, suelo ${sueloPx})`)
            if (base > sueloPx + 0.04 * px) aviso(`${id}: se pasa del suelo (y=${base} > ${sueloPx})`)
          }
        }
      }
    }
    if (lomo.reposo || lomo.dormir)
      console.log(`  · lomo (fracción de la caja sobre el suelo, para RASGOS en motor.ts): ${['reposo', 'dormir'].map((n) => `${n} ${lomo[n] ? mediana(lomo[n]).toFixed(2) : '–'}`).join(' · ')}`)
  }
}
console.log(`\n${errores} error(es), ${avisos} aviso(s)`)
process.exit(errores ? 1 : 0)
