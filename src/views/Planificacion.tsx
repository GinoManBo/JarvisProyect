import { useEffect, useMemo, useState } from 'react'
import { useDatos } from '../lib/datos'
import { id, puente, type EstadoTelegram } from '../lib/almacen'
import { AVISOS } from '../lib/avisos'
import { diasHasta, formatoLargo, hoyClave, textoCuentaRegresiva } from '../lib/fechas'
import type { AvisoEvento, Evento, TipoEvento } from '../lib/types'

const TIPOS: TipoEvento[] = ['prueba', 'entrega', 'clase', 'otro']

const PALETA = ['#2b3a8c', '#a63446', '#2f7a63', '#a86a1f', '#6b4a8c', '#1f6f8b']

export default function Planificacion() {
  const { eventos, setEventos, ramos, setRamos, ramo } = useDatos()

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState(hoyClave())
  const [tipo, setTipo] = useState<TipoEvento>('prueba')
  const [ramoId, setRamoId] = useState('')
  const [aviso, setAviso] = useState<AvisoEvento | ''>('dia')

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
      ...(aviso ? { aviso } : {}),
    }
    setEventos((prev) => [...prev, nuevo])
    setTitulo('')
  }

  // El servicio reinicia la cuenta solo: con otra frecuencia puede tocar avisar altiro.
  const cambiarAviso = (eventoId: string, valor: AvisoEvento | '') =>
    setEventos((prev) =>
      prev.map((x) => {
        if (x.id !== eventoId) return x
        const { aviso: _a, ...resto } = x
        void _a
        return valor ? { ...resto, aviso: valor } : resto
      }),
    )

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
          <div className="formulario__ancho">
            <label className="etiqueta" htmlFor="p-aviso">
              Avisar por Telegram
            </label>
            <SelectorAviso id="p-aviso" valor={aviso} onCambiar={setAviso} />
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
                {e.aviso && (
                  <span className="evento__tipo" title="Aviso por Telegram">
                    · aviso {AVISOS.find((a) => a.valor === e.aviso)?.corto}
                  </span>
                )}
              </span>
              <span className="evento__acciones">
                <SelectorAviso
                  className="evento__aviso"
                  valor={e.aviso ?? ''}
                  onCambiar={(v) => cambiarAviso(e.id, v)}
                  rotulo={`Aviso de ${e.titulo}`}
                />
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
              <div key={e.id} className="evento evento--pasado">
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

        <h2 className="plan__seccion">Telegram</h2>
        <PanelTelegram />
      </div>
    </div>
  )
}

function SelectorAviso({
  id,
  className = 'campo',
  valor,
  onCambiar,
  rotulo,
}: {
  id?: string
  className?: string
  valor: AvisoEvento | ''
  onCambiar: (v: AvisoEvento | '') => void
  rotulo?: string
}) {
  return (
    <select
      id={id}
      className={className}
      value={valor}
      aria-label={rotulo}
      onChange={(e) => onCambiar(e.target.value as AvisoEvento | '')}
    >
      <option value="">Sin aviso</option>
      {AVISOS.map((a) => (
        <option key={a.valor} value={a.valor}>
          {a.rotulo}
        </option>
      ))}
    </select>
  )
}

/**
 * El bot vive en el servicio de Railway. Acá sólo se ve si está conectado y, la
 * primera vez, cómo vincularlo: mandarle /start desde el celular.
 */
function PanelTelegram() {
  const [estado, setEstado] = useState<EstadoTelegram | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const consultar = () => void puente().avisos.estado().then(setEstado)
  useEffect(consultar, [])

  // Mientras espera el /start, vuelve a preguntar cada pocos segundos.
  const esperando = estado?.estado === 'esperando'
  useEffect(() => {
    if (!esperando) return
    const t = window.setInterval(consultar, 4000)
    return () => window.clearInterval(t)
  }, [esperando])

  if (!estado) return null

  if (estado.estado === 'apagado') {
    return (
      <div className="telegram">
        <p className="telegram__texto">
          Los avisos por Telegram no están configurados en esta copia de Jarvis.
        </p>
      </div>
    )
  }

  if (estado.estado === 'sin-conexion') {
    return (
      <div className="telegram">
        <p className="telegram__texto">
          No se pudo hablar con el servicio de avisos (¿hay internet?). Los cambios se mandan
          solos cuando vuelva la conexión.
        </p>
        <div className="telegram__fila">
          <button className="btn" onClick={consultar}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (estado.estado === 'esperando') {
    return (
      <div className="telegram">
        <p className="telegram__texto">
          Falta un paso: abre{' '}
          <a href={`https://t.me/${estado.bot}`} target="_blank" rel="noreferrer">
            t.me/{estado.bot}
          </a>{' '}
          en el celular y toca <b>Iniciar</b> (o mándale <code>/start</code>).
        </p>
        <span className="fila__pie">Esperando el /start…</span>
      </div>
    )
  }

  return (
    <div className="telegram">
      <p className="telegram__texto">
        Conectado a <b>@{estado.bot}</b>
        {estado.nombre && <> con {estado.nombre}</>}. Avisa cuando termina un bloque del reloj
        y recuerda los eventos con aviso desde las 9 de la mañana, aunque el Mac esté apagado. En
        el bot, <code>/proximos</code> muestra lo que viene.
      </p>
      <div className="telegram__fila">
        <button
          className="btn"
          disabled={ocupado}
          onClick={async () => {
            setOcupado(true)
            const ok = await puente().avisos.enviar('Prueba desde Jarvis. Si lees esto, funciona.')
            setMensaje(ok ? 'Mensaje enviado.' : 'No se pudo enviar. ¿Hay internet?')
            setOcupado(false)
          }}
        >
          Mandar prueba
        </button>
      </div>
      {mensaje && <span className="fila__pie">{mensaje}</span>}
    </div>
  )
}
