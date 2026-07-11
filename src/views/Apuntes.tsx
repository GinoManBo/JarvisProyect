import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useDatos } from '../lib/datos'
import { ahora, id, puente, type Articulo, type FichaCodigo } from '../lib/almacen'
import { barajar, cartaNueva } from '../lib/repaso'
import type { Cita, Flashcard, Nota } from '../lib/types'

type Modo = 'apuntes' | 'citas' | 'repaso'

const MARCAS = [
  { nombre: 'Amarillo', color: 'var(--marca-amarillo)' },
  { nombre: 'Rosa', color: 'var(--marca-rosa)' },
  { nombre: 'Verde', color: 'var(--marca-verde)' },
  { nombre: 'Azul', color: 'var(--marca-azul)' },
]

/** Texto plano de un fragmento HTML, para buscar y previsualizar. */
function plano(html: string): string {
  const d = document.createElement('div')
  d.innerHTML = html
  return d.textContent ?? ''
}

export default function Apuntes() {
  const [modo, setModo] = useState<Modo>('apuntes')

  return (
    <div className="doble">
      {modo === 'apuntes' ? (
        <VistaApuntes modo={modo} setModo={setModo} />
      ) : modo === 'citas' ? (
        <VistaCitas modo={modo} setModo={setModo} />
      ) : (
        <VistaRepaso modo={modo} setModo={setModo} />
      )}
    </div>
  )
}

/* --- Cabecera compartida del índice -------------------------------------- */

/**
 * Sin botón "apuntes": la sección ya se llama así en la barra de arriba y decirlo
 * dos veces sobra. Los apuntes son lo que se ve al entrar, y citas y repaso son
 * interruptores — el que está encendido, apretado de nuevo, devuelve al editor.
 */
function Modos({ modo, setModo }: { modo: Modo; setModo: (m: Modo) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {(['citas', 'repaso'] as Modo[]).map((m) => {
        const puesto = modo === m
        return (
          <button
            key={m}
            className="btn btn--mudo"
            aria-pressed={puesto}
            title={puesto ? 'Volver a los apuntes' : `Ir a ${m}`}
            onClick={() => setModo(puesto ? 'apuntes' : m)}
            style={{
              flex: 1,
              fontSize: 12,
              textTransform: 'capitalize',
              color: puesto ? 'var(--tinta)' : 'var(--tinta-tenue)',
              borderBottom: puesto ? '2px solid var(--azul)' : '2px solid transparent',
              borderRadius: 0,
            }}
          >
            {m}
          </button>
        )
      })}
    </div>
  )
}

/* --- Apuntes -------------------------------------------------------------- */

function VistaApuntes({ modo, setModo }: { modo: Modo; setModo: (m: Modo) => void }) {
  const { notas, setNotas, ramos, ramo, setFlashcards } = useDatos()
  const [busqueda, setBusqueda] = useState('')
  const [activa, setActiva] = useState<string | null>(null)
  const editor = useRef<HTMLDivElement>(null)
  const cargada = useRef<string | null>(null)

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = q
      ? notas.filter(
          (n) =>
            n.titulo.toLowerCase().includes(q) ||
            plano(n.contenido).toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : notas
    return [...lista].sort((a, b) => b.actualizado.localeCompare(a.actualizado))
  }, [notas, busqueda])

  const nota = notas.find((n) => n.id === activa) ?? null

  // El editor es no controlado: sólo volcamos el HTML al cambiar de apunte,
  // si no React pisaría el cursor en cada tecla.
  useEffect(() => {
    if (!editor.current || !nota) return
    if (cargada.current !== nota.id) {
      editor.current.innerHTML = nota.contenido
      cargada.current = nota.id
    }
  }, [nota])

  const editarNota = (cambio: Partial<Nota>) => {
    if (!activa) return
    setNotas((prev) =>
      prev.map((n) => (n.id === activa ? { ...n, ...cambio, actualizado: ahora() } : n)),
    )
  }

  const crear = () => {
    const nueva: Nota = {
      id: id(),
      ramoId: ramos[0]?.id ?? null,
      titulo: '',
      contenido: '',
      tags: [],
      creado: ahora(),
      actualizado: ahora(),
    }
    setNotas((prev) => [nueva, ...prev])
    cargada.current = null
    setActiva(nueva.id)
  }

  const borrar = () => {
    if (!activa) return
    setNotas((prev) => prev.filter((n) => n.id !== activa))
    setActiva(null)
  }

  const mandar = (comando: string, valor?: string) => {
    editor.current?.focus()
    document.execCommand(comando, false, valor)
    editarNota({ contenido: editor.current?.innerHTML ?? '' })
  }

  // Convierte la selección en una tarjeta de repaso: la pregunta es lo marcado.
  const aTarjeta = () => {
    const texto = window.getSelection()?.toString().trim()
    if (!texto || !nota) return
    setFlashcards((prev) => [cartaNueva(texto, '', nota.ramoId, id()), ...prev])
    setModo('repaso')
  }

  const porRamo = useMemo(() => {
    const grupos = new Map<string, Nota[]>()
    for (const n of filtradas) {
      const clave = n.ramoId ?? 'sin'
      grupos.set(clave, [...(grupos.get(clave) ?? []), n])
    }
    return grupos
  }, [filtradas])

  return (
    <>
      <aside className="indice">
        <div className="indice__cabeza">
          <Modos modo={modo} setModo={setModo} />
          <input
            className="campo"
            placeholder="Buscar en los apuntes"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button className="btn" onClick={crear}>
            Escribir un apunte
          </button>
        </div>

        <div className="indice__lista">
          {filtradas.length === 0 && (
            <p className="fila__pie" style={{ padding: '16px 14px' }}>
              {busqueda ? 'Nada con esa palabra.' : 'Todavía no hay apuntes.'}
            </p>
          )}
          {[...porRamo.entries()].map(([clave, lista]) => (
            <div key={clave}>
              <div className="indice__grupo">
                <span
                  className="punto"
                  style={{ background: ramo(clave)?.color ?? 'var(--tinta-tenue)' }}
                />
                {ramo(clave)?.nombre ?? 'Sin ramo'}
              </div>
              {lista.map((n) => (
                <button
                  key={n.id}
                  className="fila"
                  aria-selected={n.id === activa}
                  onClick={() => setActiva(n.id)}
                >
                  <span className="fila__titulo">{n.titulo || 'Sin título'}</span>
                  <span className="fila__pie">
                    {plano(n.contenido).slice(0, 46) || 'vacío'}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <section className="hoja">
        {!nota ? (
          <div className="vacio">
            <h3>Una hoja en blanco</h3>
            <p>Elige un apunte de la izquierda o escribe uno nuevo.</p>
          </div>
        ) : (
          <div className="margen">
            <input
              className="titulo-nota"
              placeholder="Título"
              value={nota.titulo}
              onChange={(e) => editarNota({ titulo: e.target.value })}
            />

            <div className="meta-nota">
              <select
                value={nota.ramoId ?? ''}
                onChange={(e) => editarNota({ ramoId: e.target.value || null })}
              >
                <option value="">Sin ramo</option>
                {ramos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <span>·</span>
              <input
                value={nota.tags.join(', ')}
                onChange={(e) =>
                  editarNota({
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim().replace(/^#/, ''))
                      .filter(Boolean),
                  })
                }
                placeholder="etiquetas: examen, dudas"
                style={{
                  border: 0,
                  background: 'none',
                  font: 'inherit',
                  color: 'var(--tinta-suave)',
                  flex: 1,
                  minWidth: 120,
                }}
              />
              <button className="btn btn--mudo btn--peligro" onClick={borrar}>
                Eliminar
              </button>
            </div>

            <div className="herramientas">
              <button className="herr" title="Negrita" onClick={() => mandar('bold')}>
                <b>B</b>
              </button>
              <button className="herr" title="Cursiva" onClick={() => mandar('italic')}>
                <i>I</i>
              </button>
              <button
                className="herr herr--serif"
                title="Título"
                onClick={() => mandar('formatBlock', '<h2>')}
              >
                H
              </button>
              <button
                className="herr"
                title="Rótulo"
                onClick={() => mandar('formatBlock', '<h3>')}
                style={{ fontFamily: 'var(--mono)', fontSize: 10 }}
              >
                AA
              </button>
              <button
                className="herr"
                title="Cita"
                onClick={() => mandar('formatBlock', '<blockquote>')}
              >
                ❝
              </button>
              <button
                className="herr"
                title="Lista"
                onClick={() => mandar('insertUnorderedList')}
              >
                •
              </button>

              <span className="herramientas__sep" />

              {MARCAS.map((m) => (
                <button
                  key={m.nombre}
                  className="herr herr--marca"
                  title={`Resaltar ${m.nombre.toLowerCase()}`}
                  style={{ background: m.color }}
                  onClick={() => mandar('hiliteColor', m.color)}
                />
              ))}
              <button
                className="herr"
                title="Quitar resaltado"
                onClick={() => mandar('hiliteColor', 'transparent')}
              >
                ⌫
              </button>

              <span className="herramientas__sep" />

              <button
                className="btn btn--mudo"
                style={{ fontSize: 12 }}
                title="Convertir lo seleccionado en tarjeta de repaso"
                onClick={aTarjeta}
              >
                Hacer tarjeta
              </button>
            </div>

            <div
              ref={editor}
              className="editor"
              contentEditable
              suppressContentEditableWarning
              data-vacio="Escribe acá."
              onInput={() => editarNota({ contenido: editor.current?.innerHTML ?? '' })}
            />
          </div>
        )}
      </section>
    </>
  )
}

/* --- Citas ---------------------------------------------------------------- */

function VistaCitas({ modo, setModo }: { modo: Modo; setModo: (m: Modo) => void }) {
  const { citas, setCitas, ramos, ramo } = useDatos()
  const [filtro, setFiltro] = useState('')

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    const lista = q
      ? citas.filter(
          (c) =>
            c.fuente.toLowerCase().includes(q) ||
            c.texto.toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : citas
    return [...lista].sort((a, b) => b.creado.localeCompare(a.creado))
  }, [citas, filtro])

  const editar = (idCita: string, cambio: Partial<Cita>) =>
    setCitas((prev) => prev.map((c) => (c.id === idCita ? { ...c, ...cambio } : c)))

  const crear = (semilla?: Partial<Cita>) =>
    setCitas((prev) => [
      {
        id: id(),
        ramoId: ramos[0]?.id ?? null,
        fuente: '',
        texto: '',
        comentario: '',
        tags: [],
        creado: ahora(),
        ...semilla,
      },
      ...prev,
    ])

  /* --- Buscador de los códigos ------------------------------------------- */

  const [codigos, setCodigos] = useState<FichaCodigo[]>([])
  const [slug, setSlug] = useState('civil')
  const [consulta, setConsulta] = useState('')
  const [hallazgos, setHallazgos] = useState<Articulo[]>([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    void puente()
      .codigos()
      .then((c) => {
        setCodigos(c)
        if (c.length && !c.some((x) => x.slug === slug)) setSlug(c[0].slug)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Busca sola mientras escribe, con un respiro para no barrer 2.774 artículos
  // en cada tecla.
  useEffect(() => {
    const q = consulta.trim()
    if (!q) {
      setHallazgos([])
      setBuscando(false)
      return
    }
    setBuscando(true)
    const t = window.setTimeout(() => {
      let vivo = true
      void puente()
        .buscarArticulos(slug, q)
        .then((r) => {
          if (!vivo) return
          setHallazgos(r)
          setBuscando(false)
        })
      return () => {
        vivo = false
      }
    }, 220)
    return () => window.clearTimeout(t)
  }, [slug, consulta])

  const codigo = codigos.find((c) => c.slug === slug)
  const enBusqueda = consulta.trim().length > 0

  const guardarArticulo = (a: Articulo) =>
    crear({
      fuente: `Art. ${a.etiqueta || a.num} ${a.sigla}`,
      texto: a.texto,
      tags: [a.sigla.toLowerCase()],
    })

  return (
    <>
      <aside className="indice">
        <div className="indice__cabeza">
          <Modos modo={modo} setModo={setModo} />

          <select className="campo" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {codigos.length === 0 && <option>Códigos no disponibles</option>}
            {codigos.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>

          <input
            className="campo"
            placeholder={codigo ? `Nº de artículo o palabra en el ${codigo.sigla}` : 'Buscar'}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
          />

          <button className="btn" onClick={() => crear()}>
            Escribir una cita
          </button>
        </div>

        <div className="indice__lista">
          {enBusqueda ? (
            <>
              <div className="indice__grupo">
                {buscando
                  ? 'Buscando…'
                  : `${hallazgos.length}${hallazgos.length === 5 ? '+' : ''} en el ${codigo?.sigla ?? ''}`}
              </div>
              {!buscando && hallazgos.length === 0 && (
                <span className="fila__pie" style={{ padding: '2px 14px' }}>
                  Nada con eso. Prueba con el número del artículo.
                </span>
              )}
              {hallazgos.map((a) => (
                <button
                  key={`${a.slug}-${a.etiqueta}-${a.texto.slice(0, 12)}`}
                  className="fila"
                  onClick={() =>
                    document
                      .getElementById(`art-${a.etiqueta}`)
                      ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                  }
                >
                  <span className="fila__titulo">Art. {a.etiqueta || a.num}</span>
                  <span className="fila__pie">{a.texto.replace(/\s+/g, ' ').slice(0, 70)}</span>
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="indice__grupo">Etiquetas</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '2px 14px' }}>
                {[...new Set(citas.flatMap((c) => c.tags))].map((t) => (
                  <button
                    key={t}
                    className="tag"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setFiltro(t)}
                  >
                    #{t}
                  </button>
                ))}
                {citas.length === 0 && <span className="fila__pie">Aún ninguna.</span>}
              </div>

              <div className="indice__grupo">Mis citas</div>
              <input
                className="campo"
                style={{ margin: '0 14px', width: 'calc(100% - 28px)' }}
                placeholder="Filtrar lo guardado"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </>
          )}
        </div>
      </aside>

      {enBusqueda ? (
        <section className="hoja">
          <div className="margen">
            {hallazgos.map((a) => (
              <article key={`${a.etiqueta}-${a.texto.slice(0, 12)}`} id={`art-${a.etiqueta}`} className="cita">
                <span className="cita__fuente">Art. {a.etiqueta || a.num} {a.sigla}</span>
                <p className="articulo__texto">{a.texto}</p>
                <div className="cita__pie">
                  {a.ubicacion && <span className="articulo__ubicacion">{a.ubicacion}</span>}
                  <span style={{ flex: 1 }} />
                  <button className="btn btn--mudo" onClick={() => guardarArticulo(a)}>
                    Guardar como cita
                  </button>
                </div>
              </article>
            ))}
            {!buscando && hallazgos.length === 0 && (
              <div className="vacio">
                <h3>Sin resultados</h3>
                <p>
                  Nada con «{consulta}» en el {codigo?.nombre ?? 'código'}. Escribe el número del
                  artículo, o una palabra que aparezca en su texto.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="hoja">
          {visibles.length === 0 ? (
          <div className="vacio">
            <h3>El margen está limpio</h3>
            <p>Pega acá los artículos y fallos que quieras tener a mano.</p>
          </div>
        ) : (
          <div className="margen">
            {visibles.map((c) => (
              <article key={c.id} className="cita">
                <input
                  className="cita__fuente"
                  placeholder="Art. 1545 CC"
                  value={c.fuente}
                  onChange={(e) => editar(c.id, { fuente: e.target.value })}
                  style={{ border: 0, background: 'none' }}
                />
                <AreaElastica
                  className="cita__texto"
                  placeholder="«Todo contrato legalmente celebrado es una ley para los contratantes…»"
                  value={c.texto}
                  onChange={(v) => editar(c.id, { texto: v })}
                />
                <AreaElastica
                  className="cita__comentario"
                  placeholder="Tu comentario"
                  value={c.comentario}
                  onChange={(v) => editar(c.id, { comentario: v })}
                />
                <div className="cita__pie">
                  <span className="punto" style={{ background: ramo(c.ramoId)?.color }} />
                  <select
                    value={c.ramoId ?? ''}
                    onChange={(e) => editar(c.id, { ramoId: e.target.value || null })}
                    style={{
                      border: 0,
                      background: 'none',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--tinta-suave)',
                    }}
                  >
                    <option value="">Sin ramo</option>
                    {ramos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                  <input
                    value={c.tags.join(', ')}
                    onChange={(e) =>
                      editar(c.id, {
                        tags: e.target.value
                          .split(',')
                          .map((t) => t.trim().replace(/^#/, ''))
                          .filter(Boolean),
                      })
                    }
                    placeholder="etiquetas"
                    style={{
                      border: 0,
                      background: 'none',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--tinta-tenue)',
                      flex: 1,
                    }}
                  />
                  <BotonTarjeta cita={c} />
                  <button
                    className="btn btn--mudo btn--peligro"
                    onClick={() => setCitas((prev) => prev.filter((x) => x.id !== c.id))}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
          )}
        </section>
      )}
    </>
  )
}

/**
 * Textarea que crece con lo que tiene adentro. Un artículo del Código Civil no
 * cabe en dos filas fijas, y las citas se cargan del disco *después* del primer
 * render: por eso el alto se recalcula cuando cambia el valor, no sólo al montar.
 */
function AreaElastica({
  className,
  value,
  placeholder,
  onChange,
}: {
  className: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const ajustar = useCallback(() => {
    const el = ref.current
    if (!el) return
    // 'auto' primero, si no scrollHeight arrastra el alto anterior y nunca encoge.
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  // Antes de pintar, para que no se vea el salto de alto.
  useLayoutEffect(ajustar, [value, ajustar])

  // Al angostarse la ventana el texto se reparte en más líneas.
  useEffect(() => {
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [ajustar])

  return (
    <textarea
      ref={ref}
      className={className}
      placeholder={placeholder}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/**
 * La cita se vuelve tarjeta de repaso: la fuente pregunta, el texto responde.
 * Vive fuera de VistaCitas a propósito — declarada adentro, React la remontaría
 * en cada tecla y se perdería el acuse de recibo.
 */
function BotonTarjeta({ cita }: { cita: Cita }) {
  const { setFlashcards } = useDatos()
  const [hecha, setHecha] = useState(false)
  const vacia = !cita.fuente.trim() && !cita.texto.trim()

  const hacer = () => {
    setFlashcards((prev) => [
      cartaNueva(
        cita.fuente.trim() || cita.texto.trim().slice(0, 80),
        cita.texto.trim(),
        cita.ramoId,
        id(),
      ),
      ...prev,
    ])
    setHecha(true)
    window.setTimeout(() => setHecha(false), 1800)
  }

  return (
    <button className="btn btn--mudo" disabled={vacia || hecha} onClick={hacer}>
      {hecha ? 'En el mazo ✓' : 'Hacer tarjeta'}
    </button>
  )
}

/* --- Repaso --------------------------------------------------------------- */

function VistaRepaso({ modo, setModo }: { modo: Modo; setModo: (m: Modo) => void }) {
  const { flashcards, setFlashcards, ramos, ramo } = useDatos()
  const [ramoId, setRamoId] = useState<string>('')
  const [descubierta, setDescubierta] = useState(false)
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [editando, setEditando] = useState(false)

  // Una tanda es el mazo del ramo ya barajado. Vive sólo mientras se repasa.
  const [tanda, setTanda] = useState<Flashcard[] | null>(null)
  const [posicion, setPosicion] = useState(0)

  const delRamo = useMemo(
    () => (ramoId ? flashcards.filter((c) => c.ramoId === ramoId) : flashcards),
    [flashcards, ramoId],
  )

  const carta = tanda?.[posicion]
  const terminada = tanda !== null && posicion >= tanda.length

  const comenzar = () => {
    if (delRamo.length === 0) return
    setEditando(false)
    setTanda(barajar(delRamo))
    setPosicion(0)
    setDescubierta(false)
  }

  const parar = () => {
    setTanda(null)
    setPosicion(0)
    setDescubierta(false)
  }

  const siguiente = () => {
    setPosicion((p) => p + 1)
    setDescubierta(false)
  }

  const agregar = () => {
    if (!pregunta.trim()) return
    setFlashcards((prev) => [
      cartaNueva(pregunta.trim(), respuesta.trim(), ramoId || ramos[0]?.id || null, id()),
      ...prev,
    ])
    setPregunta('')
    setRespuesta('')
  }

  // Espacio descubre la respuesta, Enter o flecha pasan a la siguiente.
  useEffect(() => {
    const onTecla = (e: KeyboardEvent) => {
      const en = e.target as HTMLElement
      if (en.tagName === 'INPUT' || en.tagName === 'TEXTAREA') return
      if (editando || !carta) return
      if (e.code === 'Space') {
        e.preventDefault()
        setDescubierta((d) => !d)
      }
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        siguiente()
      }
    }
    window.addEventListener('keydown', onTecla)
    return () => window.removeEventListener('keydown', onTecla)
  })

  const sinRespuesta = delRamo.filter((c) => !c.respuesta.trim()).length
  const nombreRamo = ramoId ? (ramo(ramoId)?.nombre ?? 'ese ramo') : 'todos los ramos'

  return (
    <>
      <aside className="indice">
        <div className="indice__cabeza">
          <Modos modo={modo} setModo={setModo} />
          <select
            className="campo"
            value={ramoId}
            onChange={(e) => {
              setRamoId(e.target.value)
              parar()
            }}
          >
            <option value="">Todos los ramos</option>
            {ramos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="indice__lista">
          <div className="indice__grupo">Nueva tarjeta</div>
          <div style={{ padding: '0 14px', display: 'grid', gap: 6 }}>
            <textarea
              className="campo"
              rows={2}
              placeholder="Pregunta"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
            />
            <textarea
              className="campo"
              rows={3}
              placeholder="Respuesta"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
            />
            <button className="btn" onClick={agregar}>
              Agregar
            </button>
          </div>

          <div className="indice__grupo">El mazo</div>
          <div style={{ padding: '0 14px', display: 'grid', gap: 6 }}>
            <span className="fila__pie">
              {delRamo.length} {delRamo.length === 1 ? 'tarjeta' : 'tarjetas'} en {nombreRamo}
            </span>
            {sinRespuesta > 0 && (
              <span className="fila__pie" style={{ color: 'var(--alarma)' }}>
                {sinRespuesta} sin respuesta
              </span>
            )}

            <button
              className="btn"
              onClick={() => {
                setEditando((v) => !v)
                parar()
              }}
              aria-pressed={editando}
            >
              {editando ? 'Cerrar el editor' : 'Editar tarjetas'}
            </button>

            <button
              className="btn btn--fuerte"
              disabled={delRamo.length === 0}
              onClick={tanda ? parar : comenzar}
            >
              {tanda ? 'Terminar' : '¡Comenzar!'}
            </button>
          </div>
        </div>
      </aside>

      <section className="hoja">
        {editando ? (
          <EditorMazo
            cartas={delRamo}
            onEditar={(idCarta, campos) =>
              setFlashcards((prev) =>
                prev.map((c) => (c.id === idCarta ? { ...c, ...campos } : c)),
              )
            }
            onEliminar={(idCarta) =>
              setFlashcards((prev) => prev.filter((c) => c.id !== idCarta))
            }
          />
        ) : terminada ? (
          <div className="vacio">
            <h3>Diste la vuelta al mazo</h3>
            <p>
              Repasaste las {tanda.length} {tanda.length === 1 ? 'tarjeta' : 'tarjetas'} de{' '}
              {nombreRamo}.
            </p>
            <div className="carta__juicio" style={{ marginTop: 18 }}>
              <button className="btn btn--fuerte" onClick={comenzar}>
                Otra vuelta
              </button>
              <button className="btn" onClick={parar}>
                Salir
              </button>
            </div>
          </div>
        ) : !carta ? (
          <div className="vacio">
            <h3>{delRamo.length ? 'Listo para repasar' : 'Sin tarjetas'}</h3>
            <p>
              {delRamo.length
                ? `${delRamo.length} ${delRamo.length === 1 ? 'tarjeta' : 'tarjetas'} en ${nombreRamo}. Aprieta “¡Comenzar!” y salen en orden aleatorio.`
                : 'Marca texto en un apunte y usa “Hacer tarjeta”, o escribe una acá al lado.'}
            </p>
          </div>
        ) : (
          <div className="repaso">
            <div className="progreso-repaso">
              <span className="punto" style={{ background: ramo(carta.ramoId)?.color }} />{' '}
              {ramo(carta.ramoId)?.nombre ?? 'Sin ramo'} · {posicion + 1} de {tanda?.length}
            </div>

            <div className="carta">
              <div className="carta__pregunta">{carta.pregunta}</div>
              {descubierta && (
                <div className="carta__respuesta">
                  {carta.respuesta || 'Esta tarjeta todavía no tiene respuesta.'}
                </div>
              )}
            </div>

            <div className="carta__juicio">
              {!descubierta && (
                <button className="btn btn--fuerte" onClick={() => setDescubierta(true)}>
                  Mostrar respuesta
                </button>
              )}
              <button
                className={descubierta ? 'btn btn--fuerte' : 'btn'}
                onClick={siguiente}
              >
                Siguiente
              </button>
            </div>

            <div className="progreso-repaso" style={{ opacity: 0.7 }}>
              espacio para descubrir · enter para la siguiente
            </div>
          </div>
        )}
      </section>
    </>
  )
}

/* --- Editor del mazo ------------------------------------------------------ */

type Campos = Pick<Flashcard, 'pregunta' | 'respuesta'>

function EditorMazo({
  cartas,
  onEditar,
  onEliminar,
}: {
  cartas: Flashcard[]
  onEditar: (id: string, campos: Campos) => void
  onEliminar: (id: string) => void
}) {
  if (cartas.length === 0) {
    return (
      <div className="vacio">
        <h3>Nada que editar</h3>
        <p>Este ramo todavía no tiene tarjetas.</p>
      </div>
    )
  }

  return (
    <div className="editor-mazo">
      <p className="fila__pie">
        {cartas.length} {cartas.length === 1 ? 'tarjeta' : 'tarjetas'} · repasar no borra nada, sólo
        se borra lo que borres acá.
      </p>
      {cartas.map((c) => (
        <FilaCarta key={c.id} carta={c} onEditar={onEditar} onEliminar={onEliminar} />
      ))}
    </div>
  )
}

function FilaCarta({
  carta,
  onEditar,
  onEliminar,
}: {
  carta: Flashcard
  onEditar: (id: string, campos: Campos) => void
  onEliminar: (id: string) => void
}) {
  const { ramo } = useDatos()
  const [pregunta, setPregunta] = useState(carta.pregunta)
  const [respuesta, setRespuesta] = useState(carta.respuesta)
  const [confirmando, setConfirmando] = useState(false)

  const sucia = pregunta !== carta.pregunta || respuesta !== carta.respuesta
  const r = ramo(carta.ramoId)

  return (
    <article className="carta-edit">
      <header className="carta-edit__cabeza">
        <span className="punto" style={{ background: r?.color ?? 'var(--tinta-tenue)' }} />
        <span className="carta-edit__ramo">{r?.nombre ?? 'Sin ramo'}</span>
      </header>

      <label className="etiqueta" htmlFor={`p-${carta.id}`}>
        Pregunta
      </label>
      <textarea
        id={`p-${carta.id}`}
        className="campo"
        rows={2}
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
      />

      <label className="etiqueta" htmlFor={`r-${carta.id}`}>
        Respuesta
      </label>
      <textarea
        id={`r-${carta.id}`}
        className="campo"
        rows={3}
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
      />

      <div className="carta-edit__mandos">
        <button
          className="btn btn--fuerte"
          disabled={!sucia || !pregunta.trim()}
          onClick={() => onEditar(carta.id, { pregunta: pregunta.trim(), respuesta: respuesta.trim() })}
        >
          Confirmar cambios
        </button>
        <button
          className="btn"
          disabled={!sucia}
          onClick={() => {
            setPregunta(carta.pregunta)
            setRespuesta(carta.respuesta)
          }}
        >
          Descartar
        </button>

        <span style={{ flex: 1 }} />

        {confirmando ? (
          <>
            <span className="fila__pie">¿Borrar de verdad?</span>
            <button className="btn btn--peligro" onClick={() => onEliminar(carta.id)}>
              Sí, borrar
            </button>
            <button className="btn btn--mudo" onClick={() => setConfirmando(false)}>
              No
            </button>
          </>
        ) : (
          <button className="btn btn--mudo btn--peligro" onClick={() => setConfirmando(true)}>
            Eliminar
          </button>
        )}
      </div>
    </article>
  )
}
