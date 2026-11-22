import manifiesto from '../../recursos/objetos/piedra/manifiesto.json'
import type { Animacion, EstiloCargado, NombreAnimacion } from './tipos'

/**
 * La piedra hueca de Descanso: no es un animal, es un objeto del mapa en el que
 * el cuy se esconde. Su arte (Aseprite, `recursos/objetos/piedra/`) usa el mismo
 * formato de hojas que los personajes — celda 64, una fila por animación, apoyo
 * en y = 60 — así que la pinta el mismo `Reproductor`; sólo cambian los nombres:
 *
 *   vacia     bucle   nadie adentro (la flor de arriba se mece)
 *   entra     pasada  el cuy se mete: la grupa en la boca, la piedra se ladea
 *   dentro    bucle   ocupada: dos ojos en lo oscuro, respira, asoma la nariz
 *   duerme    bucle   ocupada en la siesta: ojos cerrados y zetas
 *   asoma     pasada  el cuy saca la cabeza, mira y se guarda
 *   sale      pasada  el cuy sale de un salto
 *   toque     pasada  la tocaron vacía: se bambolea
 *   chillido  pasada  la tocaron con el cuy adentro: ojos enormes y «!»
 *
 * Qué animación toca lo decide el motor (`Piedra` en motor.ts).
 */

export type AnimacionPiedra = 'vacia' | 'entra' | 'dentro' | 'duerme' | 'asoma' | 'sale' | 'toque' | 'chillido'

export const ANIMACIONES_PIEDRA: readonly AnimacionPiedra[] = [
  'vacia', 'entra', 'dentro', 'duerme', 'asoma', 'sale', 'toque', 'chillido',
]

const animaciones = manifiesto.animaciones as unknown as Record<AnimacionPiedra, Animacion>

/** La boca de la piedra — por donde entra el cuy —, en fracción del ancho desde el centro de la celda. */
export const BOCA_PIEDRA = (manifiesto.boca.x - manifiesto.celdaPx / 2) / manifiesto.celdaPx

/** Cuánto dura cada animación, en ms (los bucles, una vuelta). */
export const tiemposPiedra = (): Record<AnimacionPiedra, number> =>
  Object.fromEntries(
    ANIMACIONES_PIEDRA.map((n) => [n, animaciones[n].duraciones.reduce((s, d) => s + d, 0)]),
  ) as Record<AnimacionPiedra, number>

const imagenes = import.meta.glob('../../recursos/objetos/piedra/*.png', { query: '?url', import: 'default' }) as Record<
  string,
  () => Promise<string>
>

let carga: Promise<EstiloCargado> | null = null

/** Las hojas de la piedra, ya decodificadas, con la forma que espera el Reproductor. */
export function cargarPiedra(): Promise<EstiloCargado> {
  carga ??= (async () => {
    const urls: Record<string, string[]> = {}
    for (const n of ANIMACIONES_PIEDRA) {
      const f = animaciones[n].fuente
      if (f.tipo !== 'hoja') continue
      const url = await imagenes[`../../recursos/objetos/piedra/${f.archivo}`]()
      const img = new Image()
      img.src = url
      await img.decode()
      urls[n] = Array(f.cuadros).fill(url)
    }
    // El Reproductor está tipado con los nombres de los animales; aquí sólo importa
    // que a cada nombre le corresponda una animación y sus URLs.
    return {
      manifiesto: { version: 1, animal: 'cuy', estilo: 'pixel', render: 'pixelado', celdaPx: manifiesto.celdaPx, animaciones },
      urls,
    } as unknown as EstiloCargado
  })()
  carga.catch(() => (carga = null))
  return carga
}

export const comoAnimacion = (n: AnimacionPiedra) => n as unknown as NombreAnimacion
