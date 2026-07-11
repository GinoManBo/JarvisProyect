import { useEffect, useState } from 'react'
import { ProveedorDatos, useDatos } from './lib/datos'
import { ProveedorReloj, ROTULO, reloj, useReloj } from './lib/reloj'
import Apuntes from './views/Apuntes'
import Calendario from './views/Calendario'
import Descanso from './views/Descanso'
import Planificacion from './views/Planificacion'
import Malla from './views/Malla'

const SECCIONES = ['Apuntes', 'Calendario', 'Descanso', 'Planificación', 'Malla'] as const
type Seccion = (typeof SECCIONES)[number]

/** Mientras el reloj corre se asoma en la barra, en cualquier sección. */
function RelojBarra({ onIr }: { onIr: () => void }) {
  const { fase, restante, corriendo, activo } = useReloj()
  if (!activo) return null

  return (
    <button
      className={`barra__reloj ${fase !== 'foco' ? 'barra__reloj--pausa' : ''}`}
      onClick={onIr}
      title="Ir al Descanso"
    >
      <span className={`barra__pulso ${corriendo ? 'barra__pulso--vivo' : ''}`} />
      <span className="barra__digitos">{reloj(restante)}</span>
      <span className="barra__fase">{corriendo ? ROTULO[fase] : 'En pausa'}</span>
    </button>
  )
}

function Marco() {
  const { ajustes, setAjustes } = useDatos()
  const [seccion, setSeccion] = useState<Seccion>('Apuntes')

  useEffect(() => {
    document.documentElement.dataset.tema = ajustes.tema
  }, [ajustes.tema])

  // Cmd+1..4 salta entre secciones.
  useEffect(() => {
    const onTecla = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= SECCIONES.length) {
        e.preventDefault()
        setSeccion(SECCIONES[n - 1])
      }
    }
    window.addEventListener('keydown', onTecla)
    return () => window.removeEventListener('keydown', onTecla)
  }, [])

  const cambiarTema = () =>
    setAjustes((a) => ({ ...a, tema: a.tema === 'claro' ? 'oscuro' : 'claro' }))

  return (
    <div className="app">
      <nav className="barra">
        <span className="barra__marca">Jarvis</span>
        <div className="barra__enlaces">
          {SECCIONES.map((s) => (
            <button
              key={s}
              className="tab"
              aria-current={seccion === s ? 'page' : undefined}
              onClick={() => setSeccion(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="barra__cola">
          <RelojBarra onIr={() => setSeccion('Descanso')} />
          <button className="btn btn--mudo" onClick={cambiarTema} title="Cambiar tema">
            {ajustes.tema === 'claro' ? '◐' : '◑'}
          </button>
        </div>
      </nav>

      <main className="vista">
        {seccion === 'Apuntes' && <Apuntes />}
        {seccion === 'Calendario' && <Calendario />}
        {seccion === 'Descanso' && <Descanso />}
        {seccion === 'Planificación' && <Planificacion />}
        {seccion === 'Malla' && <Malla />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ProveedorDatos>
      <ProveedorReloj>
        <Marco />
      </ProveedorReloj>
    </ProveedorDatos>
  )
}
