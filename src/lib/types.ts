export type Ramo = {
  id: string
  nombre: string
  color: string
}

export type Nota = {
  id: string
  ramoId: string | null
  titulo: string
  contenido: string // HTML del editor
  tags: string[]
  creado: string
  actualizado: string
}

export type Cita = {
  id: string
  ramoId: string | null
  fuente: string // "Art. 1545 CC", "Rol 12.345-2023"
  texto: string
  comentario: string
  tags: string[]
  creado: string
}

export type Flashcard = {
  id: string
  ramoId: string | null
  pregunta: string
  respuesta: string
  creado: string
}

export type TipoEvento = 'prueba' | 'entrega' | 'clase' | 'otro'

export type Evento = {
  id: string
  ramoId: string | null
  titulo: string
  fecha: string // YYYY-MM-DD
  tipo: TipoEvento
  nota: string
}

export type Ajustes = {
  tema: 'claro' | 'oscuro'
  pomodoro: {
    minutosFoco: number
    minutosPausaCorta: number
    minutosPausaLarga: number
    pausasHastaLarga: number
    autoseguir: boolean
  }
}

export const AJUSTES_INICIALES: Ajustes = {
  tema: 'claro',
  pomodoro: {
    minutosFoco: 25,
    minutosPausaCorta: 5,
    minutosPausaLarga: 20,
    pausasHastaLarga: 4,
    autoseguir: false,
  },
}
