import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useDatos } from './datos'
import { puente } from './almacen'

export type Fase = 'foco' | 'corta' | 'larga'

export const ROTULO: Record<Fase, string> = {
  foco: 'Estudiando',
  corta: 'Pausa',
  larga: 'Pausa larga',
}

/** Pasado este tiempo seguido de estudio, el reloj insiste en que pare. */
const LIMITE_SEGUIDO = 40 * 60
export const AVISO_LIMITE = 'Chinita recuerda descansar y dormir <3'

export const dos = (n: number) => String(n).padStart(2, '0')
export const reloj = (seg: number) => `${dos(Math.floor(seg / 60))}:${dos(seg % 60)}`

type Reloj = {
  fase: Fase
  restante: number
  total: number
  corriendo: boolean
  hechos: number
  titulo: string
  /** El reloj arrancó y todavía no vuelve al punto de partida. */
  activo: boolean
  pasada: boolean
  setTitulo: (t: string) => void
  setPasada: (v: boolean) => void
  alternar: () => void
  reiniciar: () => void
  saltar: () => void
}

const Ctx = createContext<Reloj | null>(null)

/**
 * El reloj vive sobre las secciones, no dentro de Descanso: si viviera en la
 * vista, cambiar de pestaña lo desmontaría y perdería la cuenta.
 */
export function ProveedorReloj({ children }: { children: ReactNode }) {
  const { ajustes } = useDatos()
  const cfg = ajustes.pomodoro

  const [fase, setFase] = useState<Fase>('foco')
  const [restante, setRestante] = useState(cfg.minutosFoco * 60)
  const [corriendo, setCorriendo] = useState(false)
  const [hechos, setHechos] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [pasada, setPasada] = useState(false)

  const largoDe = (f: Fase) =>
    (f === 'foco' ? cfg.minutosFoco : f === 'corta' ? cfg.minutosPausaCorta : cfg.minutosPausaLarga) *
    60

  // Tocar los minutos aplica al tiro: para el reloj y lo deja al comienzo del
  // bloque con la duración nueva.
  useEffect(() => {
    setCorriendo(false)
    setRestante(largoDe(fase))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.minutosFoco, cfg.minutosPausaCorta, cfg.minutosPausaLarga])

  useEffect(() => {
    if (!corriendo) setRestante(largoDe(fase))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase])

  const alTerminar = useRef<() => void>(() => {})
  alTerminar.current = () => {
    if (fase === 'foco') {
      const n = hechos + 1
      setHechos(n)
      const toca: Fase = n % cfg.pausasHastaLarga === 0 ? 'larga' : 'corta'
      void puente().avisar(
        titulo.trim() || 'Bloque terminado',
        toca === 'larga' ? 'Pausa larga. Levántate de la silla.' : 'Pausa corta. Estira y toma agua.',
      )
      setFase(toca)
      setRestante(largoDe(toca))
    } else {
      void puente().avisar(
        'Se acabó la pausa',
        titulo.trim() ? `Sigues con: ${titulo.trim()}` : 'De vuelta.',
      )
      setFase('foco')
      setRestante(cfg.minutosFoco * 60)
    }
    setCorriendo(cfg.autoseguir)
  }

  useEffect(() => {
    if (!corriendo) return
    const t = window.setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          alTerminar.current()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [corriendo])

  // Aviso a los 40 minutos seguidos. Sólo puede darse cuando el bloque de foco
  // dura más que eso; con bloques cortos la pausa llega antes.
  const yaAviso = useRef(false)
  useEffect(() => {
    if (fase !== 'foco') {
      yaAviso.current = false
      setPasada(false)
      return
    }
    const seguido = cfg.minutosFoco * 60 - restante
    if (seguido < LIMITE_SEGUIDO) {
      yaAviso.current = false
      setPasada(false)
      return
    }
    if (!yaAviso.current) {
      yaAviso.current = true
      setPasada(true)
      void puente().avisar(AVISO_LIMITE, 'Llevas 40 minutos seguidos. Corta un rato.')
    }
  }, [restante, fase, cfg.minutosFoco])

  const total = largoDe(fase)

  const valor: Reloj = {
    fase,
    restante,
    total,
    corriendo,
    hechos,
    titulo,
    activo: corriendo || restante !== total,
    pasada,
    setTitulo,
    setPasada,
    alternar: () => setCorriendo((c) => !c),
    reiniciar: () => {
      setCorriendo(false)
      setRestante(largoDe(fase))
    },
    saltar: () => {
      setCorriendo(false)
      alTerminar.current()
      setCorriendo(false)
    },
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useReloj(): Reloj {
  const v = useContext(Ctx)
  if (!v) throw new Error('useReloj fuera del proveedor')
  return v
}
