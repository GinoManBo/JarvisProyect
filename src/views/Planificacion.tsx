import { useMemo, useState } from 'react'
import { useDatos } from '../lib/datos'
import { id } from '../lib/almacen'
import { diasHasta, formatoLargo, hoyClave, textoCuentaRegresiva } from '../lib/fechas'
import type { Evento, TipoEvento } from '../lib/types'

const TIPOS: TipoEvento[] = ['prueba', 'entrega', 'clase', 'otro']

const PALETA = ['#2b3a8c', '#a63446', '#2f7a63', '#a86a1f', '#6b4a8c', '#1f6f8b']

export default function Planificacion() {
  const { eventos, setEventos, ramos, setRamos, ramo } = useDatos()

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState(hoyClave())
  const [tipo, setTipo] = useState<TipoEvento>('prueba')
  const [ramoId, setRamoId] = useState('')

  const { proximos, pasados } = useMemo(() => {
    const orden = [...eventos].sort((a, b) => a.fecha.localeCompare(b.fecha))
    return {
      proximos: orden.filter((e) => diasHasta(e.fecha) >= 0),
      pasados: orden.filter((e) => diasHasta(e.fecha) < 0).reverse(),
    }
  }, [eventos])

  const agregar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return
    const nuevo: Evento = {
      id: id(),
      ramoId: ramoId || ramos[0]?.id || null,
      titulo: titulo.trim(),
      fecha,
      tipo,
      nota: '',
    }
    setEventos((prev) => [...prev, nuevo])
    setTitulo('')
  }

  const agregarRamo = () =>
    setRamos((prev) => [
      ...prev,
      { id: id(), nombre: 'Ramo nuevo', color: PALETA[prev.length % PALETA.length] },
    ])

  return (
    <div className="plan">
      <div className="plan__cuerpo">
        <h1 className="plan__titulo">Lo que viene</h1>
        <p className="plan__bajada">Pruebas, entregas y clases. Todo esto aparece en el calendario.</p>

        <form className="formulario" onSubmit={agregar}>
          <div>
            <label className="etiqueta" htmlFor="p-titulo">
              Qué
            </label>
            <input
              id="p-titulo"
              className="campo"
              placeholder="Control de tipicidad"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="p-fecha">
              Cuándo
            </label>
            <input
              id="p-fecha"
              className="campo"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="p-tipo">
              Tipo
            </label>
            <select
              id="p-tipo"
              className="campo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoEvento)}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta" htmlFor="p-ramo">
              Ramo
            </label>
            <select
              id="p-ramo"
              className="campo"
              value={ramoId}
              onChange={(e) => setRamoId(e.target.value)}
            >
              {ramos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn--fuerte" type="submit">
            Agendar
          </button>
        </form>

        <h2 className="plan__seccion">Próximo</h2>
        {proximos.length === 0 && (
          <p className="fila__pie" style={{ padding: '14px 4px' }}>
            La agenda está vacía.
          </p>
        )}
        {proximos.map((e) => {
          const dias = diasHasta(e.fecha)
          return (
            <div key={e.id} className="evento">
              <span
                className={`evento__cuando ${dias <= 3 ? 'evento__cuando--urge' : ''}`}
                title={formatoLargo(e.fecha)}
              >
                {textoCuentaRegresiva(e.fecha)}
              </span>
              <span className="evento__que">
                <span
                  className="punto"
                  style={{ background: ramo(e.ramoId)?.color ?? 'var(--tinta-tenue)' }}
                />
                <span className="evento__nombre">{e.titulo}</span>
                <span className="evento__tipo">{e.tipo}</span>
              </span>
              <span className="evento__acciones">
                <button
                  className="btn btn--mudo btn--peligro"
                  onClick={() => setEventos((prev) => prev.filter((x) => x.id !== e.id))}
                >
                  Eliminar
                </button>
              </span>
            </div>
          )
        })}

        {pasados.length > 0 && (
          <>
            <h2 className="plan__seccion">Ya pasó</h2>
            {pasados.slice(0, 8).map((e) => (
              <div key={e.id} className="evento" style={{ opacity: 0.5 }}>
                <span className="evento__cuando">{textoCuentaRegresiva(e.fecha)}</span>
                <span className="evento__que">
                  <span
                    className="punto"
                    style={{ background: ramo(e.ramoId)?.color ?? 'var(--tinta-tenue)' }}
                  />
                  <span className="evento__nombre">{e.titulo}</span>
                  <span className="evento__tipo">{e.tipo}</span>
                </span>
                <span className="evento__acciones">
                  <button
                    className="btn btn--mudo btn--peligro"
                    onClick={() => setEventos((prev) => prev.filter((x) => x.id !== e.id))}
                  >
                    Eliminar
                  </button>
                </span>
              </div>
            ))}
          </>
        )}

        <h2 className="plan__seccion">Ramos</h2>
        <div className="ramos">
          {ramos.map((r) => (
            <div key={r.id} className="ramo-ficha">
              <input
                type="color"
                value={r.color}
                onChange={(e) =>
                  setRamos((prev) =>
                    prev.map((x) => (x.id === r.id ? { ...x, color: e.target.value } : x)),
                  )
                }
                style={{
                  width: 16,
                  height: 16,
                  padding: 0,
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                }}
                aria-label={`Color de ${r.nombre}`}
              />
              <input
                value={r.nombre}
                onChange={(e) =>
                  setRamos((prev) =>
                    prev.map((x) => (x.id === r.id ? { ...x, nombre: e.target.value } : x)),
                  )
                }
                aria-label="Nombre del ramo"
              />
              <button
                className="btn btn--mudo btn--peligro"
                onClick={() => setRamos((prev) => prev.filter((x) => x.id !== r.id))}
                aria-label={`Eliminar ${r.nombre}`}
              >
                ×
              </button>
            </div>
          ))}
          <button className="btn" onClick={agregarRamo}>
            Agregar ramo
          </button>
        </div>
      </div>
    </div>
  )
}
