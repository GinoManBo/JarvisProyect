import type { Flashcard } from './types'
import { ahora } from './almacen'

export function cartaNueva(
  pregunta: string,
  respuesta: string,
  ramoId: string | null,
  id: string,
): Flashcard {
  return { id, ramoId, pregunta, respuesta, creado: ahora() }
}

/** Fisher-Yates. Devuelve una copia; no toca el mazo original. */
export function barajar(cartas: Flashcard[]): Flashcard[] {
  const copia = [...cartas]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
