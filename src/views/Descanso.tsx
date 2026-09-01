import { useEffect, useState } from 'react'
import { useDatos } from '../lib/datos'
import { AVISO_LIMITE, ROTULO, reloj, useReloj } from '../lib/reloj'
import { Monitos, animoDe } from './Monitos'
import type { Ajustes } from '../lib/types'

type Pomodoro = Ajustes['pomodoro']

const PRESETS: { nombre: string; detalle: string; cfg: Omit<Pomodoro, 'autoseguir'> }[] = [
  {
    nombre: 'Clásico',
    detalle: '25 · 5 · 20',
    cfg: { minutosFoco: 25, minutosPausaCorta: 5, minutosPausaLarga: 20, pausasHastaLarga: 4 },
  },
  {
    nombre: 'Largo',
    detalle: '50 · 10 · 30',
    cfg: { minutosFoco: 50, minutosPausaCorta: 10, minutosPausaLarga: 30, pausasHastaLarga: 3 },
  },
  {
    nombre: 'Codo',
    detalle: '90 · 20 · 30',
    cfg: { minutosFoco: 90, minutosPausaCorta: 20, minutosPausaLarga: 30, pausasHastaLarga: 2 },
  },
]

export default function Descanso() {
  const { ajustes, setAjustes } = useDatos()
  const cfg = ajustes.pomodoro

  // El reloj no vive acá: vive sobre las secciones, para que cambiar de pestaña
  // no lo desmonte ni le borre la cuenta.
  const {
    fase,
    restante,
    total,
    corriendo,
    hechos,
    titulo,
    pasada,
    setTitulo,
    setPasada,
    alternar,
    reiniciar,
    saltar,
  } = useReloj()

  // Geometría del anillo: el progreso es el arco que ya se trazó.
  const RADIO = 126
  const VUELTA = 2 * Math.PI * RADIO
  const avance = total ? (total - restante) / total : 0

  // Los monitos siguen al reloj: duermen parado, estudian en foco, juegan en pausa.
  const animo = animoDe(fase, corriendo)

  const cambiarCfg = (cambio: Partial<Pomodoro>) =>
    setAjustes((a) => ({ ...a, pomodoro: { ...a.pomodoro, ...cambio } }))

  return (
    <div className="reloj">
      <div className="reloj__centro">
        {pasada && (
          <div className="aviso-limite" role="alert">
            <span className="aviso-limite__texto">{AVISO_LIMITE}</span>
            <button
              className="btn btn--mudo"
              onClick={() => setPasada(false)}
              aria-label="Cerrar el aviso"
            >
              ×
            </button>
          </div>
        )}

        <input
          className="reloj__rotulo"
          placeholder="¿En qué estás?"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <div className="anillo">
          <svg className="anillo__svg" viewBox="0 0 264 264" aria-hidden="true">
            <circle className="anillo__riel" cx="132" cy="132" r={RADIO} />
            <circle
              className="anillo__tinta"
              cx="132"
              cy="132"
              r={RADIO}
              strokeDasharray={VUELTA}
              strokeDashoffset={VUELTA * (1 - avance)}
            />
          </svg>
          <div className="anillo__centro">
            <span className="reloj__fase">{ROTULO[fase]}</span>
            <div className={`reloj__digitos ${fase !== 'foco' ? 'reloj__digitos--pausa' : ''}`}>
              {reloj(restante)}
            </div>
            <span className="anillo__pie">de {reloj(total)}</span>
          </div>
        </div>

        <div className="reloj__mandos">
          <button className="btn btn--fuerte" onClick={alternar}>
            {corriendo ? 'Pausar' : restante === total ? 'Empezar' : 'Seguir'}
          </button>
          <button className="btn" onClick={reiniciar}>
            Reiniciar
          </button>
          <button className="btn" onClick={saltar}>
            Saltar
          </button>
        </div>

        <div className="tiempos">
          <Tiempo
            rotulo="Estudio"
            valor={cfg.minutosFoco}
            min={1}
            max={180}
            onPoner={(v) => cambiarCfg({ minutosFoco: v })}
          />
          <span className="tiempos__sep" />
          <Tiempo
            rotulo="Descanso"
            valor={cfg.minutosPausaCorta}
            min={1}
            max={60}
            onPoner={(v) => cambiarCfg({ minutosPausaCorta: v })}
          />
        </div>

        <div className="reloj__cuenta">
          {hechos > 0 && (
            <>
              {Array.from({ length: Math.min(hechos, 12) }, (_, i) => (
                <span key={i} className="tomate tomate--lleno" />
              ))}
              <span style={{ marginLeft: 4 }}>
                {hechos} {hechos === 1 ? 'bloque hoy' : 'bloques hoy'}
              </span>
            </>
          )}
        </div>

        <Monitos animo={animo} />
      </div>

      <aside className="panel">
        <PanelReloj cfg={cfg} onCambiar={cambiarCfg} />

        <h3 style={{ marginTop: 8 }}>Respirar</h3>
        <Respiracion />
      </aside>
    </div>
  )
}

/* --- Ajustes del reloj ---------------------------------------------------- */

const CLAVES_PRESET: (keyof Omit<Pomodoro, 'autoseguir'>)[] = [
  'minutosFoco',
  'minutosPausaCorta',
  'minutosPausaLarga',
  'pausasHastaLarga',
]

function PanelReloj({
  cfg,
  onCambiar,
}: {
  cfg: Pomodoro
  onCambiar: (cambio: Partial<Pomodoro>) => void
}) {
  return (
    <>
      <h3>El reloj</h3>

      <div className="presets">
        {PRESETS.map((p) => {
          const puesto = CLAVES_PRESET.every((k) => cfg[k] === p.cfg[k])
          return (
            <button
              key={p.nombre}
              className={`preset ${puesto ? 'preset--puesto' : ''}`}
              onClick={() => onCambiar(p.cfg)}
            >
              <span className="preset__nombre">{p.nombre}</span>
              <span className="preset__detalle">{p.detalle}</span>
            </button>
          )
        })}
      </div>

      <div className="ajuste">
        <span>Pausa larga</span>
        <NumeroEditable
          className="ajuste__num"
          valor={cfg.minutosPausaLarga}
          min={1}
          max={120}
          rotulo="Minutos de pausa larga"
          onPoner={(v) => onCambiar({ minutosPausaLarga: v })}
        />
      </div>
      <div className="ajuste">
        <span>Larga cada</span>
        <NumeroEditable
          className="ajuste__num"
          valor={cfg.pausasHastaLarga}
          min={2}
          max={10}
          rotulo="Bloques hasta la pausa larga"
          onPoner={(v) => onCambiar({ pausasHastaLarga: v })}
        />
      </div>
      <div className="ajuste">
        <span>Encadenar solo</span>
        <input
          type="checkbox"
          checked={cfg.autoseguir}
          onChange={(e) => onCambiar({ autoseguir: e.target.checked })}
        />
      </div>

      <span className="fila__pie">
        Los minutos se aplican al tiro y el reloj vuelve al comienzo del bloque.
      </span>
    </>
  )
}

const acotar = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min

/**
 * Número que se escribe de verdad. Guarda un borrador local mientras se tipea y
 * recién confirma al salir o con Enter — confirmar cada tecla convertía el campo
 * vacío en el mínimo y no dejaba escribir "50" (el 5 ya se había vuelto 1).
 */
function NumeroEditable({
  className,
  valor,
  min,
  max,
  rotulo,
  onPoner,
}: {
  className: string
  valor: number
  min: number
  max: number
  rotulo: string
  onPoner: (v: number) => void
}) {
  const [texto, setTexto] = useState(String(valor))
  const [foco, setFoco] = useState(false)

  useEffect(() => {
    if (!foco) setTexto(String(valor))
  }, [valor, foco])

  const confirmar = () => {
    setFoco(false)
    if (texto.trim() === '') {
      setTexto(String(valor))
      return
    }
    const v = acotar(Number(texto), min, max)
    setTexto(String(v))
    if (v !== valor) onPoner(v)
  }

  return (
    <input
      className={className}
      inputMode="numeric"
      value={texto}
      aria-label={rotulo}
      onFocus={(e) => {
        setFoco(true)
        e.target.select()
      }}
      onChange={(e) => setTexto(e.target.value.replace(/\D/g, ''))}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

/** Estudio y descanso viven bajo el reloj: minutos a la vista, − / + de a 5. */
function Tiempo({
  rotulo,
  valor,
  min,
  max,
  onPoner,
}: {
  rotulo: string
  valor: number
  min: number
  max: number
  onPoner: (v: number) => void
}) {
  const mover = (paso: number) => onPoner(acotar(valor + paso, min, max))

  return (
    <div className="tiempo">
      <span className="tiempo__rotulo">{rotulo}</span>
      <div className="tiempo__mando">
        <button
          className="btn tiempo__paso"
          onClick={() => mover(-5)}
          disabled={valor <= min}
          aria-label={`Bajar ${rotulo}`}
        >
          −
        </button>
        <NumeroEditable
          className="tiempo__valor"
          valor={valor}
          min={min}
          max={max}
          rotulo={`Minutos de ${rotulo}`}
          onPoner={onPoner}
        />
        <button
          className="btn tiempo__paso"
          onClick={() => mover(5)}
          disabled={valor >= max}
          aria-label={`Subir ${rotulo}`}
        >
          +
        </button>
      </div>
      <span className="tiempo__min">min</span>
    </div>
  )
}

/* --- 4-7-8: inhala 4, sostiene 7, exhala 8 -------------------------------- */

type FaseAire = 'quieto' | 'inhala' | 'sostiene' | 'exhala'

const DURACION: Record<FaseAire, number> = { quieto: 0, inhala: 4, sostiene: 7, exhala: 8 }
const SIGUIENTE: Record<FaseAire, FaseAire> = {
  quieto: 'inhala',
  inhala: 'sostiene',
  sostiene: 'exhala',
  exhala: 'inhala',
}
const TEXTO: Record<FaseAire, string> = {
  quieto: 'Empezar',
  inhala: 'Inhala',
  sostiene: 'Sostén',
  exhala: 'Exhala',
}

function Respiracion() {
  const [fase, setFase] = useState<FaseAire>('quieto')
  const [cuenta, setCuenta] = useState(0)
  const [rondas, setRondas] = useState(0)

  useEffect(() => {
    if (fase === 'quieto') return
    const t = window.setInterval(() => {
      setCuenta((c) => {
        if (c <= 1) {
          const prox = SIGUIENTE[fase]
          if (prox === 'inhala') setRondas((r) => r + 1)
          setFase(prox)
          return DURACION[prox]
        }
        return c - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [fase])

  const alternar = () => {
    if (fase === 'quieto') {
      setFase('inhala')
      setCuenta(DURACION.inhala)
      setRondas(0)
    } else {
      setFase('quieto')
      setCuenta(0)
    }
  }

  return (
    <div className="respirar">
      <button
        className="respirar__circulo"
        data-fase={fase}
        onClick={alternar}
        title="4 inhala · 7 sostén · 8 exhala"
      >
        {fase === 'quieto' ? TEXTO.quieto : `${TEXTO[fase]} ${cuenta}`}
      </button>
      <span className="fila__pie" style={{ textAlign: 'center' }}>
        {fase === 'quieto'
          ? 'Cuatro dentro, siete quieto, ocho fuera.'
          : `${rondas} ${rondas === 1 ? 'ronda' : 'rondas'} · toca para parar`}
      </span>
    </div>
  )
}
