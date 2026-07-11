import { useMemo, useState } from 'react'
import { useDatos } from '../lib/datos'
import { id } from '../lib/almacen'
import {
  CUMPLE,
  DIAS,
  MESES,
  cuadriculaMes,
  desdeClave,
  edadEn,
  esCumple,
  formatoLargo,
  hoyClave,
  textoCuentaRegresiva,
} from '../lib/fechas'
import type { Evento, TipoEvento } from '../lib/types'

const TIPOS: TipoEvento[] = ['prueba', 'entrega', 'clase', 'otro']

export default function Calendario() {
  const { eventos, setEventos, ramos, ramo } = useDatos()
  const hoy = hoyClave()
  const inicio = desdeClave(hoy)

  const [anio, setAnio] = useState(inicio.getFullYear())
  const [mes, setMes] = useState(inicio.getMonth())
  const [elegido, setElegido] = useState(hoy)

  const semanas = useMemo(() => cuadriculaMes(anio, mes), [anio, mes])

  const porDia = useMemo(() => {
    const m = new Map<string, Evento[]>()
    for (const e of eventos) m.set(e.fecha, [...(m.get(e.fecha) ?? []), e])
    return m
  }, [eventos])

  const mover = (paso: number) => {
    const d = new Date(anio, mes + paso, 1)
    setAnio(d.getFullYear())
    setMes(d.getMonth())
  }

  const irHoy = () => {
    setAnio(inicio.getFullYear())
    setMes(inicio.getMonth())
    setElegido(hoy)
  }

  const delDia = porDia.get(elegido) ?? []

  const agregarRapido = (titulo: string) => {
    if (!titulo.trim()) return
    const nuevo: Evento = {
      id: id(),
      ramoId: ramos[0]?.id ?? null,
      titulo: titulo.trim(),
      fecha: elegido,
      tipo: 'otro',
      nota: '',
    }
    setEventos((prev) => [...prev, nuevo])
  }

  return (
    <div className="cal">
      <section className="cal__hoja">
        <header className="cal__cabeza">
          <h2 className="cal__mes">{MESES[mes]}</h2>
          <span className="cal__anio">{anio}</span>
          <div className="cal__nav">
            <button className="btn" onClick={() => mover(-1)} aria-label="Mes anterior">
              ←
            </button>
            <button className="btn" onClick={irHoy}>
              Hoy
            </button>
            <button className="btn" onClick={() => mover(1)} aria-label="Mes siguiente">
              →
            </button>
          </div>
        </header>

        <div className="cal__dias">
          {DIAS.map((d) => (
            <span key={d} className="cal__dia-rotulo">
              {d}
            </span>
          ))}
        </div>

        <div className="cal__cuadricula">
          {semanas.flat().map((clave) => {
            const d = desdeClave(clave)
            const fuera = d.getMonth() !== mes
            const eventosDia = porDia.get(clave) ?? []
            const cumple = esCumple(clave)

            const clases = [
              'celda',
              fuera ? 'celda--fuera' : '',
              clave === hoy ? 'celda--hoy' : '',
              clave === elegido ? 'celda--elegida' : '',
              cumple ? 'celda--cumple' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button key={clave} className={clases} onClick={() => setElegido(clave)}>
                <span className="celda__num">
                  {d.getDate()}
                  {cumple && !fuera && <span title="Cumpleaños de Javiera">♥</span>}
                </span>
                {eventosDia.slice(0, 3).map((e) => {
                  const r = ramo(e.ramoId)
                  return (
                    <span
                      key={e.id}
                      className={`marca-evento ${e.tipo === 'prueba' ? 'marca-evento--prueba' : ''}`}
                      style={{ ['--color' as string]: r?.color ?? 'var(--tinta-tenue)' }}
                      title={r ? `${e.titulo} (${r.nombre})` : e.titulo}
                    >
                      {e.titulo}
                      {r && <span className="marca-evento__ramo"> ({r.nombre})</span>}
                    </span>
                  )
                })}
                {eventosDia.length > 3 && (
                  <span className="cal__mas">+{eventosDia.length - 3} más</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <aside className="dia">
        <h3 className="dia__fecha">{formatoLargo(elegido)}</h3>
        <span className="fila__pie">{textoCuentaRegresiva(elegido)}</span>

        {esCumple(elegido) && (
          <span className="dia__cumple">
            Javiera cumple {edadEn(elegido)} · {CUMPLE.dia}/{CUMPLE.mes}
          </span>
        )}

        {delDia.length === 0 && (
          <p className="fila__pie" style={{ margin: '8px 0' }}>
            Nada agendado este día.
          </p>
        )}

        {delDia.map((e) => (
          <div
            key={e.id}
            className="dia__evento"
            style={{ ['--color' as string]: ramo(e.ramoId)?.color ?? 'var(--regla)' }}
          >
            <div>
              {e.titulo}
              <small>
                {e.tipo} · {ramo(e.ramoId)?.nombre ?? 'sin ramo'}
              </small>
            </div>
            <button
              className="btn btn--mudo btn--peligro"
              onClick={() => setEventos((prev) => prev.filter((x) => x.id !== e.id))}
              aria-label={`Eliminar ${e.titulo}`}
            >
              ×
            </button>
          </div>
        ))}

        <AltaRapida onAgregar={agregarRapido} />

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <span className="etiqueta">Tipos</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TIPOS.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function AltaRapida({ onAgregar }: { onAgregar: (titulo: string) => void }) {
  const [texto, setTexto] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onAgregar(texto)
        setTexto('')
      }}
      style={{ marginTop: 8 }}
    >
      <input
        className="campo"
        placeholder="Agendar algo este día"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
    </form>
  )
}
