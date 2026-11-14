import type { Animal, EstiloArte, EstiloCargado, Manifiesto, NombreAnimacion } from './tipos'

/**
 * Carga perezosa de los recursos: los manifiestos (diminutos) entran con el
 * bundle; las imágenes sólo se piden cuando un personaje las necesita, así
 * siete animales × N estilos no engordan el arranque.
 */

const manifiestos = import.meta.glob('../../recursos/personajes/*/*/manifiesto.json', {
  eager: true,
  import: 'default',
}) as Record<string, Manifiesto>

const imagenes = import.meta.glob('../../recursos/personajes/*/*/**/*.png', {
  query: '?url',
  import: 'default',
}) as Record<string, () => Promise<string>>

const base = (animal: Animal, estilo: EstiloArte) => `../../recursos/personajes/${animal}/${estilo}`

export const estilosDe = (animal: Animal): EstiloArte[] =>
  (Object.values(manifiestos) as Manifiesto[]).filter((m) => m.animal === animal).map((m) => m.estilo)

/** ¿Ya hay arte de este animal en este estilo? Los monitos sin hojas siguen con su piel SVG. */
export const tieneArte = (animal: Animal, estilo: EstiloArte): boolean => estilosDe(animal).includes(estilo)

const cache = new Map<string, Promise<EstiloCargado>>()

function decodificar(url: string): Promise<void> {
  const img = new Image()
  img.src = url
  return img.decode().catch(() => {
    throw new Error(`No se pudo decodificar ${url}`)
  })
}

/** Resuelve URLs y decodifica todas las imágenes del estilo antes de resolver:
    así el primer cuadro nunca parpadea ni llega a medio cargar. */
export function cargarEstilo(animal: Animal, estilo: EstiloArte): Promise<EstiloCargado> {
  const clave = `${animal}/${estilo}`
  const previo = cache.get(clave)
  if (previo) return previo

  const trabajo = (async () => {
    const m = manifiestos[`${base(animal, estilo)}/manifiesto.json`]
    if (!m) throw new Error(`Sin manifiesto para ${clave}`)

    const urls = {} as Record<NombreAnimacion, string[]>
    for (const [nombre, anim] of Object.entries(m.animaciones) as [NombreAnimacion, Manifiesto['animaciones'][NombreAnimacion]][]) {
      const f = anim.fuente
      const archivos =
        f.tipo === 'hoja'
          ? [f.archivo]
          : Array.from({ length: f.cuadros }, (_, i) =>
              f.patron.replace('{n}', String(i).padStart(f.digitos, '0')),
            )
      const resueltas = await Promise.all(
        archivos.map(async (a) => {
          const carga = imagenes[`${base(animal, estilo)}/${a}`]
          if (!carga) throw new Error(`Falta ${clave}/${a}`)
          return carga()
        }),
      )
      await Promise.all(resueltas.map(decodificar))
      urls[nombre] = f.tipo === 'hoja' ? Array(f.cuadros).fill(resueltas[0]) : resueltas
    }
    return { manifiesto: m, urls }
  })()

  cache.set(clave, trabajo)
  trabajo.catch(() => cache.delete(clave))
  return trabajo
}
