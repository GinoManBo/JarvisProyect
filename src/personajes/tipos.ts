/**
 * Tipos del sistema de personajes con arte pre-producido (hojas de sprites).
 * El formato exacto de los archivos está en recursos/personajes/ESPECIFICACION.md.
 */

/** Lado de la caja lógica de todo personaje, en unidades. Las hojas no tienen
    por qué medir esto en píxeles (pixel art: 64, caricatura: 256); el reproductor
    escala la celda a la caja. */
export const LIENZO = 128

/** Punto de apoyo común a todos los estilos: x centrado, y = el suelo. Los pies
    caen aquí en CADA fotograma de CADA estilo; es lo que hace que el personaje
    no salte ni cambie de sitio cuando cambia de piel. */
export const ANCLA = { x: 64, y: 120 } as const

export type Animal = 'gatito' | 'perrito' | 'conejito' | 'ranita' | 'caracol' | 'cuy' | 'appa'
export type EstiloArte = 'pixel' | 'caricatura'
export type NombreAnimacion = 'reposo' | 'dormir' | 'caminar' | 'poof'

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
  animaciones: Record<NombreAnimacion, Animacion>
}

/** Un manifiesto con las URLs de sus imágenes ya resueltas. */
export type EstiloCargado = {
  manifiesto: Manifiesto
  /** Por animación: la URL de cada CUADRO dibujado (hoja: la misma repetida). */
  urls: Record<NombreAnimacion, string[]>
}

export const pasos = (a: Animacion): number[] =>
  a.orden ?? Array.from({ length: a.fuente.cuadros }, (_, i) => i)

export const filas = (f: FuenteHoja): number => Math.ceil(f.cuadros / f.columnas)
