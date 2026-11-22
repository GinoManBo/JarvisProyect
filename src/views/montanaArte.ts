import type { Momento } from './praderaArte'

/**
 * Arte del fondo "montaña con momo" del Descanso (contrato en
 * .ui-pipeline/06-fondo-montana.md). A diferencia de la pradera, que se dibuja
 * entera por código, aquí las capas vienen de Aseprite como PNG en
 * recursos/fondo/montana/, pintadas UNA sola vez con la paleta del día. La
 * tarde, la noche y el modo oscuro no son otro juego de PNG ni un velo encima:
 * se recolorea cada píxel por su nombre en la paleta (cambio de paleta
 * indexado), así cada momento tiene sus propios colores y no un tinte plano.
 *
 * Los PNG entran como data URL (`?inline`): la app empaquetada se abre por
 * file://, y ahí un <canvas> con una imagen de archivo queda "manchado" y no
 * deja leer sus píxeles; con data URL sí. Pesan unos pocos KB.
 */

export type NombreCapa =
  | 'lejos'
  | 'suelo'
  | 'montana'
  | 'momo'
  | 'brillo'
  | 'espuma'
  | 'nubes'
  | 'petalos'
  | 'koi'
  | 'koiGiro'

/** Capas opcionales (la "vida" de la escena): si su PNG falta, o no mide lo
    pactado, esa pieza no sale y el resto sigue igual. */
export type NombreExtra =
  | 'puente'
  | 'toro'
  | 'pilas'
  | 'hierbas'
  | 'mariposas'
  | 'libelulas'
  | 'aves'
  | 'nubesLejos'
  | 'nubesGrandes'
  | 'koiSalto'
  | 'chapoteo'
  | 'sendero'
  // Monumentos de piedra (§14 del contrato): sin su PNG no salen.
  | 'torii'
  | 'komainu'
  | 'jizo'
  | 'yukimi'
  | 'sekihi'
  | 'pagodas'

export type NombreHoja = NombreCapa | NombreExtra

/** Una capa: celda de `ancho`×`alto`; la hoja mide ancho·cuadros × alto·filas.
    `x` desde la izquierda y `abajo` desde el borde inferior, en píxeles del fondo. */
export type Capa = {
  archivo: string
  ancho: number
  alto: number
  cuadros?: number
  filas?: number
  x?: number
  abajo?: number
}

export type Cielo = {
  /** De arriba hacia el horizonte. */
  bandas: string[]
  astro: string
  astroSombra: string
  estrella: string
  luciernaga: string
  /** Centro encendido del astro, su halo punteado y su reflejo en el agua. */
  nucleo?: string
  halo?: string
  reflejo?: string
}

export type BandaHierba = {
  nombre: string
  /** Entre qué alturas (px desde abajo) se apoya la base del detalle. */
  abajo: [number, number]
  /** 0–1: fracción de casillas ocupadas. */
  densidad: number
  /** Columnas de hierbas.png que pueden salir (repetir = más probable). */
  variantes: number[]
  /** Se pinta antes que la montaña y el agua (orilla lejana). */
  detras?: boolean
}

/** La luz de un momento (§15): tonos extra para el lado del sol (sólo código,
    nunca en `pintado`), el color del filo iluminado y el de las sombras. */
export type LuzMomento = {
  tonos: Record<string, string>
  /** Con el sol a la vista, la cara de la montaña que le da la espalda baja
      estas llaves a un tono frío: así las dos caras se separan y vuelve la forma. */
  sombraLado?: Record<string, string>
  borde: string
  alfaBanda: number
  anchoBanda: number
  sombra: string
  alfaSombra: number
  alfaNube: number
  escalon: boolean
  intensidad: number
}

/** Cómo baja el modo oscuro un momento: multiplicar por `k` y luego mezclar
    `t` hacia `oscuro.hacia` (conserva la saturación mejor que la mezcla sola). */
export type Atenuar = {
  k: number
  t: number
  kTenue: number
  tTenue: number
  kCielo: number
  tCielo: number
  kAstro: number
  tAstro: number
  intensidad: number
  /** Después de atenuar, estas llaves se mezclan `t` hacia `hacia`: la roca
      crema del día, oscurecida a secas, quedaba gris barro. */
  frio?: { hacia: string; t: number; llaves: string[] }
}

/** Un monumento de piedra puesto en la escena (§14). `x` es el borde izquierdo
    de la celda: en px de montana.png para `montana` y `cima`, en columnas de
    la tesela de lejos.png para `lejos` (se repite cada tesela). */
export type Monumento = {
  id: string
  hoja: NombreExtra
  cuadro?: number
  ancla: 'montana' | 'cima' | 'lejos'
  x: number
  abajo?: number
  /** Cuánto se hunde en la cordillera (px) para no quedar flotando. */
  hundir?: number
  /** Si un miembro del grupo no cabe, no sale ninguno. */
  grupo?: string
  sombra?: boolean
  /** Tiene una segunda fila (o columna, el yukimi) encendida de tarde y de noche. */
  luz?: boolean
  /** Dónde arde, en coordenadas de la celda: ahí va el resplandor nocturno. */
  fuego?: [number, number]
  /** Ventanas encendidas de una pieza lejana (pagodas), en coordenadas de la celda:
      cada una lleva un halo tibio de tarde y de noche. */
  fuegos?: [number, number][]
}

export type ManifiestoFondo = {
  version: number
  escena: string
  /** Lado de un píxel del fondo en px CSS; sube en uno si el área pasa de `pxAncho`. */
  px: number
  pxAncho: number
  capas: Record<NombreCapa, Capa>
  extras?: Partial<Record<NombreExtra, Capa>>
  /** El puente se arrima a la derecha de la placa del reloj (`placaCss` px CSS de ancho). */
  puente?: { placaCss: number; margen: number; sendero?: { dx: number } }
  /** El farol va `dx` px a la derecha del borde izquierdo del puente. */
  toro?: { dx: number }
  /** Pilas de piedras: `x` desde la izquierda, desde la derecha o desde el puente. */
  pilas?: { lugares: { variante: number; ancla: 'izq' | 'der' | 'puente'; x: number; abajo: number }[] }
  hierbas?: { paso: number; mecen: number[]; bandas: BandaHierba[] }
  vida?: {
    mariposas: Record<Momento, number>
    libelulas: Record<Momento, number>
    aves: { cadaMs: number; cruceMs: number }
  }
  /** La franja de agua dentro del suelo, medida desde abajo. */
  agua: { abajo: number; alto: number }
  /** El río que baja por la montaña: polilínea en coordenadas de montana.png. */
  rio: { puntos: [number, number][]; ancho: number; destellos: number }
  /** De dónde nacen los pétalos: rectángulo en coordenadas de la celda de momo.png. */
  copa: { x: number; y: number; ancho: number; alto: number }
  koi: { cantidad: number; xMin: number; margen: number; msCuadro: number; msGiro: number }
  petalos: { cantidad: number }
  cielo: Record<Momento, Cielo>
  /** Los colores con que están pintados los PNG (la paleta del documento de
      Aseprite), por llave. Si falta, es `paleta.dia`. Separarlos deja afinar el
      día sin repintar el arte. */
  pintado?: Record<string, string>
  /** Mismas llaves en los tres momentos y en `pintado`. */
  paleta: Record<Momento, Record<string, string>>
  /** Saltos de los koi: cada cuánto, qué fracción queda varada en la orilla y
      los tiempos de cada tramo (ms) y del arco (px). */
  saltos?: {
    cadaMs: [number, number]
    nocheFactor: number
    varado: number
    saltoMs: number
    alto: number
    largo: number
    varadoMs: [number, number]
    aleteoMs: number
    vueltaMs: number
    chapoteoMs: number
  }
  /** Reflejos de arcoíris del día: bandas de color y su opacidad. */
  arcoiris?: { colores: string[]; alfa: number; alfaOscuro: number }
  oscuro: {
    hacia: string
    fondo: number
    tenue: number
    tenues: string[]
    intactos: string[]
    /** Por momento; el que falte (la noche) baja con la mezcla de siempre. */
    atenuar?: Partial<Record<Momento, Atenuar>>
  }
  /** La luz del sol sobre el arte (§15). `cresta`: columna de la cumbre de cada
      hoja; `escalon`: qué llave sube a qué tono en la cara que da al sol. */
  luz?: { cresta: Partial<Record<NombreHoja, number>>; escalon: Record<string, string> } & Record<Momento, LuzMomento>
  monumentos?: { margen: number; piezas: Monumento[] }
}

type Hoja = { ancho: number; alto: number; datos: Uint8ClampedArray; llaves: (string | undefined)[] }

export type ArteMontana = { m: ManifiestoFondo; hojas: Record<NombreCapa, Hoja> & Partial<Record<NombreExtra, Hoja>> }

export type Lienzos = Record<NombreCapa, HTMLCanvasElement> & Partial<Record<NombreExtra, HTMLCanvasElement>>

export type Colores = {
  paleta: Record<string, string>
  cielo: Cielo
  /** Los tonos de `luz[momento].tonos`, ya atenuados si toca. */
  tonos: Record<string, string>
  /** `luz[momento].sombraLado`, ya atenuado si toca. */
  sombraLado: Record<string, string>
  luz: { borde: string; sombra: string }
}

const CARPETA = '../../recursos/fondo/montana'

const manifiestos = import.meta.glob('../../recursos/fondo/*/manifiesto.json', {
  eager: true,
  import: 'default',
}) as Record<string, ManifiestoFondo>

const imagenes = import.meta.glob('../../recursos/fondo/*/*.png', {
  query: '?inline',
  import: 'default',
}) as Record<string, () => Promise<string>>

const manifiesto = (): ManifiestoFondo | undefined => manifiestos[`${CARPETA}/manifiesto.json`]

/** ¿Está el fondo entregado? Hace falta el manifiesto y TODOS sus PNG; con uno
    que falte se sigue con la pradera de siempre. */
export function hayMontana(): boolean {
  const m = manifiesto()
  return !!m && Object.values(m.capas).every((c) => `${CARPETA}/${c.archivo}` in imagenes)
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const mezcla = (c: string, con: string, t: number) => {
  const a = hex(c)
  const b = hex(con)
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
/** Multiplica cada canal por `k`. */
const escala = (c: string, k: number) =>
  '#' + hex(c).map((v) => Math.round(Math.min(255, v * k)).toString(16).padStart(2, '0')).join('')
/** El modo oscuro de un color: multiplicar y después teñir un poco hacia `hacia`. */
const atenua = (c: string, hacia: string, k: number, t: number) => mezcla(escala(c, k), hacia, t)

async function leerHoja(m: ManifiestoFondo, capa: Capa, deDia: Map<number, string>): Promise<Hoja> {
  const url = await imagenes[`${CARPETA}/${capa.archivo}`]()
  const img = new Image()
  img.src = url
  await img.decode()
  const ancho = capa.ancho * (capa.cuadros ?? 1)
  const alto = capa.alto * (capa.filas ?? 1)
  if (img.naturalWidth !== ancho || img.naturalHeight !== alto) {
    throw new Error(
      `${capa.archivo} mide ${img.naturalWidth}×${img.naturalHeight} y el manifiesto (v${m.version}) pide ${ancho}×${alto}`,
    )
  }
  const cv = document.createElement('canvas')
  cv.width = ancho
  cv.height = alto
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const datos = ctx.getImageData(0, 0, ancho, alto).data
  const llaves: (string | undefined)[] = new Array(ancho * alto)
  for (let i = 0; i < llaves.length; i++) {
    const o = i * 4
    if (datos[o + 3]) llaves[i] = deDia.get((datos[o] << 16) | (datos[o + 1] << 8) | datos[o + 2])
  }
  return { ancho, alto, datos, llaves }
}

let carga: Promise<ArteMontana> | null = null
let listo: ArteMontana | null = null

/** El arte ya cargado, si lo está: al volver a Descanso se pinta sin esperar. */
export const montanaLista = (): ArteMontana | null => listo

/** Lee y decodifica todas las capas. Falla (y el fondo vuelve a la pradera) si
    falta un PNG o alguno no mide lo que dice el manifiesto. */
export function cargarMontana(): Promise<ArteMontana> {
  if (carga) return carga
  const trabajo = (async () => {
    const m = manifiesto()
    if (!m || !hayMontana()) throw new Error('Fondo de montaña sin entregar')
    const deDia = new Map<number, string>()
    for (const [llave, color] of Object.entries(m.pintado ?? m.paleta.dia)) {
      const [r, g, b] = hex(color)
      deDia.set((r << 16) | (g << 8) | b, llave)
    }
    const nombres = Object.keys(m.capas) as NombreCapa[]
    const hojas = await Promise.all(nombres.map((n) => leerHoja(m, m.capas[n], deDia)))
    const todas = Object.fromEntries(nombres.map((n, i) => [n, hojas[i]])) as ArteMontana['hojas']
    // Las opcionales, una por una: la que falle se queda fuera y nada más.
    await Promise.all(
      (Object.entries(m.extras ?? {}) as [NombreExtra, Capa][]).map(async ([n, capa]) => {
        if (!(`${CARPETA}/${capa.archivo}` in imagenes)) return
        try {
          todas[n] = await leerHoja(m, capa, deDia)
        } catch (e) {
          console.warn('[fondo] sin', n, e)
        }
      }),
    )
    listo = { m, hojas: todas }
    return listo
  })()
  carga = trabajo
  trabajo.catch(() => {
    carga = null
  })
  return trabajo
}

const colores = new Map<string, Colores>()

/** La paleta y el cielo de un momento. El modo oscuro baja todo hacia el azul
    de la noche por código, como la pradera: de día y de tarde multiplicando y
    tiñendo (`oscuro.atenuar`), de noche con la mezcla de siempre. Las flores y
    los koi bajan menos, para que sigan siendo lo que se mira. */
export function coloresDe(m: ManifiestoFondo, momento: Momento, oscuro: boolean): Colores {
  const k = `${momento}${oscuro ? '-o' : ''}`
  let c = colores.get(k)
  if (!c) {
    const paleta = { ...m.paleta[momento] }
    let cielo = m.cielo[momento]
    const L = m.luz?.[momento]
    const tonos = { ...(L?.tonos ?? {}) }
    const sombraLado = { ...(L?.sombraLado ?? {}) }
    const luz = { borde: L?.borde ?? cielo.halo ?? cielo.astro, sombra: L?.sombra ?? paleta.tinta }
    const o = m.oscuro
    const at = oscuro ? o.atenuar?.[momento] : undefined
    if (at) {
      for (const llave of Object.keys(paleta)) {
        if (o.intactos.includes(llave)) continue
        const tenue = o.tenues.includes(llave)
        paleta[llave] = atenua(paleta[llave], o.hacia, tenue ? at.kTenue : at.k, tenue ? at.tTenue : at.t)
      }
      for (const llave of Object.keys(tonos)) tonos[llave] = atenua(tonos[llave], o.hacia, at.k, at.t)
      for (const llave of Object.keys(sombraLado)) sombraLado[llave] = atenua(sombraLado[llave], o.hacia, at.k, at.t)
      if (at.frio) {
        const { hacia, t, llaves } = at.frio
        for (const tabla of [paleta, tonos, sombraLado]) {
          for (const llave of llaves) if (tabla[llave]) tabla[llave] = mezcla(tabla[llave], hacia, t)
        }
      }
      luz.sombra = atenua(luz.sombra, o.hacia, at.k, at.t)
      luz.borde = atenua(luz.borde, o.hacia, at.kAstro, at.tAstro)
      const astro = (v: string | undefined) => v && atenua(v, o.hacia, at.kAstro, at.tAstro)
      cielo = {
        ...cielo,
        bandas: cielo.bandas.map((b) => atenua(b, o.hacia, at.kCielo, at.tCielo)),
        astro: astro(cielo.astro)!,
        astroSombra: astro(cielo.astroSombra)!,
        nucleo: astro(cielo.nucleo),
        halo: astro(cielo.halo),
        reflejo: astro(cielo.reflejo),
      }
    } else if (oscuro) {
      for (const llave of Object.keys(paleta)) {
        if (o.intactos.includes(llave)) continue
        paleta[llave] = mezcla(paleta[llave], o.hacia, o.tenues.includes(llave) ? o.tenue : o.fondo)
      }
      for (const llave of Object.keys(tonos)) tonos[llave] = mezcla(tonos[llave], o.hacia, o.fondo)
      for (const llave of Object.keys(sombraLado)) sombraLado[llave] = mezcla(sombraLado[llave], o.hacia, o.fondo)
      luz.sombra = mezcla(luz.sombra, o.hacia, o.fondo)
      // El filo a la luna baja como lo claro, no como la roca: sigue leyéndose
      // como luz, pero ya no es un contorno blanco sobre roca casi negra.
      luz.borde = mezcla(luz.borde, o.hacia, o.tenue)
      cielo = { ...cielo, bandas: cielo.bandas.map((b) => mezcla(b, o.hacia, o.fondo)) }
    }
    c = { paleta, cielo, tonos, sombraLado, luz }
    colores.set(k, c)
  }
  return c
}

const lienzos = new Map<string, Lienzos>()

/** Las capas ya recoloreadas para un momento, listas para `drawImage`. */
export function lienzosDe(arte: ArteMontana, momento: Momento, oscuro: boolean): Lienzos {
  const k = `${momento}${oscuro ? '-o' : ''}`
  let l = lienzos.get(k)
  if (!l) {
    const { paleta } = coloresDe(arte.m, momento, oscuro)
    const rgb = new Map(Object.entries(paleta).map(([llave, color]) => [llave, hex(color)]))
    l = {} as Lienzos
    for (const nombre of Object.keys(arte.hojas) as NombreHoja[]) {
      const h = arte.hojas[nombre]!
      const cv = document.createElement('canvas')
      cv.width = h.ancho
      cv.height = h.alto
      const ctx = cv.getContext('2d')!
      const salida = ctx.createImageData(h.ancho, h.alto)
      salida.data.set(h.datos)
      for (let i = 0; i < h.llaves.length; i++) {
        const llave = h.llaves[i]
        const c = llave && rgb.get(llave)
        if (!c) continue // fuera de paleta: queda como se pintó
        const o = i * 4
        salida.data[o] = c[0]
        salida.data[o + 1] = c[1]
        salida.data[o + 2] = c[2]
      }
      ctx.putImageData(salida, 0, 0)
      l[nombre] = cv
    }
    lienzos.set(k, l)
  }
  return l
}

const tablas = new WeakMap<ManifiestoFondo, Record<string, Capa>>()

/** Capas y extras en una sola tabla, armada una vez por manifiesto. */
export function capasDe(m: ManifiestoFondo): Record<NombreHoja, Capa> {
  let t = tablas.get(m)
  if (!t) {
    t = { ...m.capas, ...m.extras }
    tablas.set(m, t)
  }
  return t as Record<NombreHoja, Capa>
}

const siluetas = new Map<string, Int16Array>()

/** La silueta de una celda (columna `col`, fila 0) de una hoja: por cada
    columna, cuántos px sube desde la base de la celda (0 = columna vacía). Con
    ella se proyectan las sombras. `null` si la hoja opcional no llegó. */
export function alturasDe(arte: ArteMontana, n: NombreHoja, col = 0): Int16Array | null {
  const clave = `${n}:${col}`
  const previa = siluetas.get(clave)
  if (previa) return previa
  const h = arte.hojas[n]
  const c = capasDe(arte.m)[n]
  if (!h || !c) return null
  const x0 = col * c.ancho
  const alt = new Int16Array(c.ancho)
  for (let x = 0; x < c.ancho && x0 + x < h.ancho; x++) {
    for (let y = 0; y < c.alto; y++) {
      if (h.datos[(y * h.ancho + x0 + x) * 4 + 3]) {
        alt[x] = c.alto - y
        break
      }
    }
  }
  siluetas.set(clave, alt)
  return alt
}

/** ¿Hay tinta en ese píxel de la celda `col` (fila 0) de la hoja? */
export function opaco(arte: ArteMontana, n: NombreHoja, x: number, y: number, col = 0): boolean {
  const h = arte.hojas[n]
  const c = capasDe(arte.m)[n]
  if (!h || !c || x < 0 || y < 0 || x >= c.ancho || y >= c.alto) return false
  const xx = col * c.ancho + x
  return xx < h.ancho && h.datos[(y * h.ancho + xx) * 4 + 3] > 0
}

const iluminados = new Map<string, HTMLCanvasElement>()

/** La hoja (montana o momo) con el escalón de luz: en la cara que da al sol
    (`lado` 1 = el sol a la derecha de la cresta) cada llave de `luz.escalon`
    sube un tono. Sigue siendo un cambio de paleta por píxel, sin degradados: la
    costura junto a la cresta va en damero, y con `nivel` 1 (el sol recién
    asomando por la cumbre) toda la cara va en damero. `nivel` 0 = sin escalón. */
export function lienzoIluminado(
  arte: ArteMontana,
  n: 'montana' | 'momo',
  momento: Momento,
  oscuro: boolean,
  lado: 1 | -1,
  nivel: 0 | 1 | 2,
): HTMLCanvasElement {
  const base = lienzosDe(arte, momento, oscuro)[n]
  const L = arte.m.luz
  if (nivel === 0 || !L) return base
  const clave = `${n}:${momento}:${oscuro ? 'o' : ''}:${lado}:${nivel}`
  const previo = iluminados.get(clave)
  if (previo) return previo
  const h = arte.hojas[n]
  const celda = arte.m.capas[n].ancho
  const cresta = L.cresta[n] ?? Math.floor(celda / 2)
  const col = coloresDe(arte.m, momento, oscuro)
  const rgb = new Map(Object.entries(col.paleta).map(([llave, c]) => [llave, hex(c)]))
  const sube = new Map(
    Object.entries(L.escalon).map(([de, a]) => [de, hex(col.tonos[a] ?? col.paleta[a] ?? col.paleta[de])]),
  )
  const baja = new Map(Object.entries(col.sombraLado).map(([de, a]) => [de, hex(a)]))
  const cv = document.createElement('canvas')
  cv.width = h.ancho
  cv.height = h.alto
  const ctx = cv.getContext('2d')!
  const salida = ctx.createImageData(h.ancho, h.alto)
  salida.data.set(h.datos)
  // La frontera entre las dos caras va, fila por fila, por la grieta oscura
  // (rocaSombra) más cercana a la cresta: ahí la costura se esconde en el
  // pliegue en vez de cortar la roca con una raya vertical. Si en esa fila no
  // hay grieta cerca, la frontera es la cresta y va en damero.
  const frontera = new Int16Array(h.alto * Math.ceil(h.ancho / celda)).fill(-1)
  for (let y = 0; y < h.alto; y++) {
    for (let k = 0; k * celda < h.ancho; k++) {
      for (let d = 0; d <= 24; d++) {
        const hit = [cresta - d, cresta + d].find(
          (cx) => cx >= 0 && cx < celda && h.llaves[y * h.ancho + k * celda + cx] === 'rocaSombra',
        )
        if (hit !== undefined) {
          frontera[y * Math.ceil(h.ancho / celda) + k] = hit
          break
        }
      }
    }
  }
  for (let i = 0; i < h.llaves.length; i++) {
    const llave = h.llaves[i]
    if (!llave) continue
    let c = rgb.get(llave)
    const alto = sube.get(llave)
    const bajo = baja.get(llave)
    if (alto || bajo) {
      const px = i % h.ancho
      const cx = px % celda
      const y = Math.floor(i / h.ancho)
      const f = frontera[y * Math.ceil(h.ancho / celda) + Math.floor(px / celda)]
      const corte = f < 0 ? cresta : f
      const alSol = lado === 1 ? cx >= corte : cx < corte
      const damero = nivel === 1 || (f < 0 && Math.abs(cx - cresta) <= 2)
      const enDamero = damero && ((cx + y) & 1) !== 0
      // Al sol sube un tono; a la espalda, lo que el arte pintó iluminado baja
      // a un tono frío (la luz del arte viene de arriba a la izquierda y el
      // sol camina por la derecha). La costura comparte el damero.
      if (alSol && alto && !enDamero) c = alto
      else if (!alSol && bajo && !(damero && !enDamero)) c = bajo
    }
    if (!c) continue
    const o = i * 4
    salida.data[o] = c[0]
    salida.data[o + 1] = c[1]
    salida.data[o + 2] = c[2]
  }
  ctx.putImageData(salida, 0, 0)
  iluminados.set(clave, cv)
  return cv
}

/** Los filos de una celda, como pares x,y empaquetados (coordenadas de la
    celda): `lado[1]` los píxeles con aire a la derecha, `lado[-1]` a la
    izquierda, `arriba` los que tienen aire encima; `banda*` los `ancho` px que
    siguen hacia dentro de cada filo. El agua y su brillo (la cascada) no tienen
    filo: es agua, no roca. */
export type Filos = {
  lado: Record<1 | -1, Int16Array>
  arriba: Int16Array
  bandaLado: Record<1 | -1, Int16Array>
  bandaArriba: Int16Array
}

const filos = new Map<string, Filos>()

export function filosDe(arte: ArteMontana, n: NombreHoja, col: number, ancho: number): Filos | null {
  const clave = `${n}:${col}:${ancho}`
  const previo = filos.get(clave)
  if (previo) return previo
  const h = arte.hojas[n]
  const c = capasDe(arte.m)[n]
  if (!h || !c) return null
  const x0 = col * c.ancho
  const op = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < c.ancho && y < c.alto && x0 + x < h.ancho && h.datos[(y * h.ancho + x0 + x) * 4 + 3] > 0
  const llave = (x: number, y: number) => h.llaves[y * h.ancho + x0 + x]
  const der: number[] = []
  const izq: number[] = []
  const sup: number[] = []
  const bDer: number[] = []
  const bIzq: number[] = []
  const bSup: number[] = []
  /** ¿A cuántos px (1 = vecino) está el aire en esa dirección? 0 si a más de `lim`. */
  const aire = (x: number, y: number, dx: number, dy: number, lim: number) => {
    for (let d = 1; d <= lim; d++) if (!op(x + dx * d, y + dy * d)) return d
    return 0
  }
  for (let y = 0; y < c.alto; y++) {
    for (let x = 0; x < c.ancho; x++) {
      if (!op(x, y)) continue
      const k = llave(x, y)
      if (k === 'agua' || k === 'brillo' || k === 'aguaHonda') continue
      const dd = aire(x, y, 1, 0, ancho + 1)
      const di = aire(x, y, -1, 0, ancho + 1)
      const da = aire(x, y, 0, -1, ancho + 1)
      // Cada píxel en una sola lista de banda, para que el velo no se doble.
      const filo = dd === 1 || di === 1 || da === 1
      if (dd === 1) der.push(x, y)
      if (di === 1) izq.push(x, y)
      if (da === 1) sup.push(x, y)
      if (filo) continue
      if (dd > 1) bDer.push(x, y)
      if (di > 1) bIzq.push(x, y)
      if (da > 1 && !dd && !di) bSup.push(x, y)
    }
  }
  const f: Filos = {
    lado: { 1: Int16Array.from(der), [-1]: Int16Array.from(izq) } as Record<1 | -1, Int16Array>,
    arriba: Int16Array.from(sup),
    bandaLado: { 1: Int16Array.from(bDer), [-1]: Int16Array.from(bIzq) } as Record<1 | -1, Int16Array>,
    bandaArriba: Int16Array.from(bSup),
  }
  filos.set(clave, f)
  return f
}
