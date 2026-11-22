/**
 * Tipos del sistema de personajes con arte pre-producido (hojas de sprites).
 * El formato exacto de los archivos está en recursos/personajes/ESPECIFICACION.md.
 */

/** Lado de la caja lógica de todo personaje, en unidades. Las hojas no tienen
    por qué medir esto en píxeles (pixel art: 64, caricatura: 256); el reproductor
    escala la celda a la caja. */
export const LIENZO = 128

/** Punto de apoyo común a todos los estilos: x centrado, y = el suelo (en la
    celda de 64 del pixel art es 32, 60). Los pies
    caen aquí en CADA fotograma de CADA estilo; es lo que hace que el personaje
    no salte ni cambie de sitio cuando cambia de piel. */
export const ANCLA = { x: 64, y: 120 } as const

export type Animal = 'gatito' | 'perrito' | 'conejito' | 'ranita' | 'caracol' | 'cuy' | 'appa'
export type EstiloArte = 'pixel' | 'caricatura'

/** Las tres que todo manifiesto trae sí o sí. */
export type AnimacionBase = 'reposo' | 'dormir' | 'caminar'
/** Las del juego (contrato en .ui-pipeline/05-monitos-juego.md) y la nube. Un
    manifiesto antiguo puede no traerlas: el reproductor pone un suplente. */
export type AnimacionOpcional =
  | 'colgar'
  | 'caer'
  | 'jugar'
  | 'reaccion'
  | 'poof'
  // Ampliación (hoy sólo el gatito): colgado del borde del marco, hecho bolita
  // girando mientras cae, y tendido de espalda tomando aire hasta pararse.
  | 'trepar'
  | 'voltereta'
  | 'tendido'
  // Ampliación (hoy sólo Appa): la bajada en zigzag — planea en picada y vira en
  // cada extremo —, y al salir del sueño se estira y despega de un salto.
  | 'planear'
  | 'virar'
  | 'despertar'
  | 'despegar'
export type NombreAnimacion = AnimacionBase | AnimacionOpcional

/** Las que se reproducen una vez y avisan al terminar. */
export const UNA_PASADA: readonly NombreAnimacion[] = [
  'caer', 'jugar', 'reaccion', 'tendido', 'virar', 'despertar', 'despegar', 'poof',
]

/** Punto de agarre de `colgar`, en fracción de la caja: (32, 8) de la celda de
    64. El motor pone ese punto bajo el puntero. */
export const AGARRE = { x: 32 / 64, y: 8 / 64 } as const

/** Punto de agarre de `trepar`: las patas delanteras, (32, 6) de la celda de 64.
    El motor pone ese punto en el borde del marco. */
export const AGARRE_TREPAR = { x: 32 / 64, y: 6 / 64 } as const

/** Cuánto dura cada animación de una pasada cuando el animal no la tiene
    dibujada (manifiesto antiguo o piel SVG): el motor y el reproductor usan
    estos mismos tiempos, así el juego corre igual con o sin arte. */
export const SUPLENTE_MS = {
  caer: 320, jugar: 900, impacto: 560, reaccion: 700, tendido: 2400,
  // Appa: el viraje (y cuándo, dentro de él, se da vuelta), el estirón al
  // despertar y el despegue (y cuándo, dentro de él, salta).
  virar: 500, giro: 200, despertar: 1200, despegar: 700, impulso: 420,
} as const

export type FuenteHoja = {
  tipo: 'hoja'
  archivo: string
  columnas: number
  cuadros: number
}

export type FuenteSecuencia = {
  tipo: 'secuencia'
  /** Con `{n}` donde va el número del cuadro (desde 0), relleno a `digitos`. */
  patron: string
  digitos: number
  cuadros: number
}

export type Animacion = {
  fuente: FuenteHoja | FuenteSecuencia
  /** Qué cuadros dibujados se muestran y en qué orden. Por defecto 0..cuadros-1.
      Permite reusar dibujos (ida y vuelta de la respiración) sin repetirlos. */
  orden?: number[]
  /** Milisegundos de cada PASO (uno por entrada de `orden`). Variables a propósito:
      ahí viven las pausas expresivas. */
  duraciones: number[]
  bucle: boolean
  /** Paso que se muestra congelado con "reducir movimiento". */
  fijo?: number
  /** Pasos con significado. En `poof`: `cubre` (nube tapa al personaje: aquí se
      cambia el estilo) y `libera` (la nube se abre: el personaje reaparece). */
  marcas?: Record<string, number>
}

export type Manifiesto = {
  version: 1
  animal: Animal
  estilo: EstiloArte
  render: 'pixelado' | 'suave'
  /** Lado en píxeles de un cuadro cuadrado. */
  celdaPx: number
  animaciones: Record<AnimacionBase, Animacion> & Partial<Record<AnimacionOpcional, Animacion>>
}

/** Un manifiesto con las URLs de sus imágenes ya resueltas. */
export type EstiloCargado = {
  manifiesto: Manifiesto
  /** Por animación: la URL de cada CUADRO dibujado (hoja: la misma repetida). */
  urls: Partial<Record<NombreAnimacion, string[]>>
}

/** A falta de una animación, cuál la reemplaza (y si tampoco, la siguiente). */
const SUPLENTES: Partial<Record<NombreAnimacion, NombreAnimacion>> = {
  trepar: 'colgar',
  voltereta: 'colgar',
  planear: 'caminar',
  virar: 'planear',
}

/** Qué animación se reproduce de verdad cuando se pide `nombre`: ella misma si
    está dibujada y cargada; si no, su suplente (trepar y voltereta → colgar;
    virar → planear → caminar) y al final `reposo` (colgar, caer, jugar, reaccion,
    tendido, despertar, despegar de un animal que aún no las tiene). Nunca lanza. */
export function resolverAnimacion(est: EstiloCargado, nombre: NombreAnimacion): NombreAnimacion {
  let n: NombreAnimacion | undefined = nombre
  while (n && !(est.manifiesto.animaciones[n] && est.urls[n])) n = SUPLENTES[n]
  return n ?? 'reposo'
}

/** Tiempos, en ms, que el motor necesita de un animal. */
export type Tiempos = {
  /** Una vuelta de `caminar`: el periodo del salto de los que andan a saltos. 0 = sin dato. */
  caminar: number
  caer: number
  jugar: number
  /** Desde que empieza `jugar` hasta su marca `impacto`. */
  impacto: number
  reaccion: number
  tendido: number
  /** Appa. `giro`: desde que empieza `virar` hasta su marca `giro` (ahí el motor
      lo da vuelta); `impulso`: desde que empieza `despegar` hasta su marca
      `impulso` (ahí el motor lo lanza hacia arriba). */
  virar: number
  giro: number
  despertar: number
  despegar: number
  impulso: number
}

const total = (a: Animacion | undefined): number | undefined =>
  a ? a.duraciones.reduce((s, d) => s + d, 0) : undefined

/** ms desde que empieza la animación hasta su marca; sin marca, `sin`. */
const hasta = (a: Animacion | undefined, marca: string, sin: number): number => {
  const p = a?.marcas?.[marca]
  return a && p != null ? a.duraciones.slice(0, p).reduce((s, d) => s + d, 0) : sin
}

/** Los tiempos de un manifiesto; sin manifiesto (piel SVG) o sin la animación, los suplentes. */
export function tiemposDe(m?: Manifiesto): Tiempos {
  const a = m?.animaciones
  const jugar = a?.jugar
  const marca = jugar?.marcas?.impacto
  const dur = total(jugar)
  return {
    caminar: total(a?.caminar) ?? 0,
    caer: total(a?.caer) ?? SUPLENTE_MS.caer,
    jugar: dur ?? SUPLENTE_MS.jugar,
    impacto:
      jugar && dur != null
        ? marca != null
          ? jugar.duraciones.slice(0, marca).reduce((s, d) => s + d, 0)
          : dur * 0.6
        : SUPLENTE_MS.impacto,
    reaccion: total(a?.reaccion) ?? SUPLENTE_MS.reaccion,
    tendido: total(a?.tendido) ?? SUPLENTE_MS.tendido,
    virar: total(a?.virar) ?? SUPLENTE_MS.virar,
    giro: hasta(a?.virar, 'giro', SUPLENTE_MS.giro),
    despertar: total(a?.despertar) ?? SUPLENTE_MS.despertar,
    despegar: total(a?.despegar) ?? SUPLENTE_MS.despegar,
    impulso: hasta(a?.despegar, 'impulso', a?.despegar ? total(a.despegar)! * 0.6 : SUPLENTE_MS.impulso),
  }
}

export const pasos = (a: Animacion): number[] =>
  a.orden ?? Array.from({ length: a.fuente.cuadros }, (_, i) => i)

export const filas = (f: FuenteHoja): number => Math.ceil(f.cuadros / f.columnas)
