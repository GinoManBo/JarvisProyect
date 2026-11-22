/**
 * Dónde está la luz de la escena de Descanso, compartido entre el fondo
 * (Montana.tsx, que mueve el sol/la luna y lo publica) y los monitos
 * (Monitos.tsx, que proyectan su sombra según esa luz). Sin React: una
 * variable de módulo y suscriptores, para leerla dentro de un rAF sin renders.
 */

export interface Luz {
  /** Posición horizontal de la fuente de luz, 0 = borde izq. del área, 1 = borde der. */
  x: number
  /** Altura sobre el horizonte, 0 = en el horizonte, 1 = cénit. */
  altura: number
  /** Fuerza de las sombras, 0 = sin sombra (noche nublada), 1 = sol pleno. */
  intensidad: number
  /** true si la fuente está tapada por la montaña (la montaña proyecta sombra larga). */
  tapada: boolean
}

let actual: Luz = { x: 0.75, altura: 0.7, intensidad: 1, tapada: false }
const oyentes = new Set<(l: Luz) => void>()

export function luz(): Luz {
  return actual
}

export function publicarLuz(l: Luz): void {
  actual = l
  oyentes.forEach((f) => f(l))
}

export function alCambiarLuz(f: (l: Luz) => void): () => void {
  oyentes.add(f)
  return () => oyentes.delete(f)
}
