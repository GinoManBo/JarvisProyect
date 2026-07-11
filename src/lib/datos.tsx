import { createContext, useContext, type ReactNode } from 'react'
import { useColeccion } from './almacen'
import { AJUSTES_INICIALES, type Ajustes, type Cita, type Evento, type Flashcard, type Nota, type Ramo } from './types'
import type { EstadoMalla } from './malla'

const RAMOS_INICIALES: Ramo[] = [
  { id: 'civil', nombre: 'Derecho Civil', color: '#2b3a8c' },
  { id: 'penal', nombre: 'Derecho Penal', color: '#a63446' },
  { id: 'constitucional', nombre: 'Constitucional', color: '#2f7a63' },
  { id: 'procesal', nombre: 'Procesal', color: '#a86a1f' },
]

type Datos = {
  ramos: Ramo[]
  setRamos: (f: (p: Ramo[]) => Ramo[]) => void
  notas: Nota[]
  setNotas: (f: (p: Nota[]) => Nota[]) => void
  citas: Cita[]
  setCitas: (f: (p: Cita[]) => Cita[]) => void
  flashcards: Flashcard[]
  setFlashcards: (f: (p: Flashcard[]) => Flashcard[]) => void
  eventos: Evento[]
  setEventos: (f: (p: Evento[]) => Evento[]) => void
  ajustes: Ajustes
  setAjustes: (f: (p: Ajustes) => Ajustes) => void
  malla: Record<string, EstadoMalla>
  setMalla: (f: (p: Record<string, EstadoMalla>) => Record<string, EstadoMalla>) => void
  ramo: (id: string | null) => Ramo | undefined
}

const Ctx = createContext<Datos | null>(null)

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const [ramos, setRamos] = useColeccion<Ramo[]>('ramos', RAMOS_INICIALES)
  const [notas, setNotas] = useColeccion<Nota[]>('notas', [])
  const [citas, setCitas] = useColeccion<Cita[]>('citas', [])
  const [flashcards, setFlashcards] = useColeccion<Flashcard[]>('flashcards', [])
  const [eventos, setEventos] = useColeccion<Evento[]>('eventos', [])
  const [ajustes, setAjustes] = useColeccion<Ajustes>('ajustes', AJUSTES_INICIALES)
  const [malla, setMalla] = useColeccion<Record<string, EstadoMalla>>('malla', {})

  const valor: Datos = {
    ramos,
    setRamos,
    notas,
    setNotas,
    citas,
    setCitas,
    flashcards,
    setFlashcards,
    eventos,
    setEventos,
    ajustes,
    setAjustes,
    malla,
    setMalla,
    ramo: (id) => ramos.find((r) => r.id === id),
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useDatos(): Datos {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDatos fuera del proveedor')
  return v
}
