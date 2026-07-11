import { app } from 'electron'
import path from 'node:path'
import { promises as fs } from 'node:fs'

/**
 * Los códigos chilenos vienen empaquetados con la app (`recursos/codigos/`), no
 * se bajan en caliente: Javiera tiene que poder buscar un artículo en el metro.
 * Se regeneran a mano con `node scripts/codigos.mjs`.
 *
 * Viven en el proceso main porque son 7 MB de JSON: cargarlos al renderer de una
 * dejaría la app pegada varios segundos al abrir.
 */

export type Articulo = {
  num: number | null
  etiqueta: string
  transitorio: boolean
  texto: string
  ubicacion: string
}

export type Codigo = {
  slug: string
  sigla: string
  nombre: string
  idNorma: number
  tituloNorma: string
  fuente: string
  bajado: string
  articulos: Articulo[]
}

export type FichaCodigo = {
  slug: string
  sigla: string
  nombre: string
  articulos: number
}

export type Hallazgo = Articulo & { slug: string; sigla: string }

const carpeta = () => path.join(app.getAppPath(), 'recursos', 'codigos')

// Un código pesa hasta 3 MB; se cachea el que se abre y no se suelta.
const cache = new Map<string, Codigo>()

/** El slug viene del renderer: se valida contra el índice antes de tocar el disco. */
async function cargar(slug: string): Promise<Codigo | null> {
  const enCache = cache.get(slug)
  if (enCache) return enCache

  const fichas = await indice()
  if (!fichas.some((f) => f.slug === slug)) return null

  try {
    const crudo = await fs.readFile(path.join(carpeta(), `${slug}.json`), 'utf8')
    const codigo = JSON.parse(crudo) as Codigo
    cache.set(slug, codigo)
    return codigo
  } catch {
    return null
  }
}

let fichas: FichaCodigo[] | null = null

export async function indice(): Promise<FichaCodigo[]> {
  if (fichas) return fichas
  try {
    const crudo = await fs.readFile(path.join(carpeta(), 'indice.json'), 'utf8')
    fichas = JSON.parse(crudo) as FichaCodigo[]
  } catch {
    fichas = []
  }
  return fichas
}

/**
 * Sin tildes, en minúscula y con los espacios colapsados: "artículo" tiene que
 * empatar con "articulo", y "legítima defensa" con el texto aunque en el código
 * venga partida entre dos líneas.
 */
const pelar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')

const TOPE = 5

export async function buscar(slug: string, consulta: string): Promise<Hallazgo[]> {
  const codigo = await cargar(slug)
  if (!codigo) return []

  const q = consulta.trim()
  if (!q) return []

  const marca = (a: Articulo): Hallazgo => ({ ...a, slug: codigo.slug, sigla: codigo.sigla })

  // Los transitorios reinician la numeración desde el 1: van siempre al final,
  // o taparían el artículo 1 de verdad.
  const orden = (a: Articulo, b: Articulo) =>
    Number(a.transitorio) - Number(b.transitorio) ||
    (a.num ?? 0) - (b.num ?? 0) ||
    a.etiqueta.localeCompare(b.etiqueta)

  // "1545" o "1545 bis": se busca por número, que es como se cita un artículo.
  const porNumero = /^\d+/.exec(q)
  if (porNumero) {
    const n = Number(porNumero[0])
    // El que se pidió va primero; después "1545 bis", "1545 ter"; y sólo al final
    // los que apenas empiezan con esos dígitos (154 → 1540, 1545…).
    const exactos = codigo.articulos.filter((a) => a.num === n).sort(orden)
    const parecidos = codigo.articulos
      .filter((a) => a.num !== n && String(a.num ?? '').startsWith(porNumero[0]))
      .sort(orden)
    return [...exactos, ...parecidos].slice(0, TOPE).map(marca)
  }

  // Por palabras, no por frase exacta: la ley casi nunca dice lo que se estudia.
  // "legítima defensa" no aparece literal en el Código Penal — el artículo 10
  // habla del "que obra en defensa de su persona" —, pero ambas palabras están.
  const palabras = pelar(q).split(' ').filter(Boolean)
  const frase = pelar(q)

  const encontrados = codigo.articulos.flatMap((a) => {
    const heno = `${pelar(a.texto)} ${pelar(a.ubicacion)}`
    if (!palabras.every((p) => heno.includes(p))) return []
    // La frase literal, si la hay, vale más que las palabras sueltas.
    return [{ a, peso: heno.includes(frase) ? 0 : 1 }]
  })

  return encontrados
    .sort((x, y) => x.peso - y.peso || orden(x.a, y.a))
    .slice(0, TOPE)
    .map(({ a }) => marca(a))
}
