import { useDatos } from '../lib/datos'
import { ANIOS, SEMESTRES, type EstadoMalla } from '../lib/malla'

/** Cada clic avanza el estado del bloque: nada → X roja → brillo amarillo → nada. */
const SIGUIENTE: Record<string, EstadoMalla | undefined> = {
  nada: 'x',
  x: 'brillo',
  brillo: undefined,
}

const LEYENDA: { estado: EstadoMalla | undefined; texto: string }[] = [
  { estado: undefined, texto: 'pendiente' },
  { estado: 'x', texto: 'aprobado' },
  { estado: 'brillo', texto: 'cursando' },
]

export default function Malla() {
  const { malla, setMalla } = useDatos()

  const avanzar = (id: string) => {
    const proximo = SIGUIENTE[malla[id] ?? 'nada']
    setMalla((prev) => {
      const nueva = { ...prev }
      if (proximo) nueva[id] = proximo
      else delete nueva[id]
      return nueva
    })
  }

  const aprobados = Object.values(malla).filter((e) => e === 'x').length
  const total = SEMESTRES.reduce((n, s) => n + s.ramos.length, 0)

  return (
    <div className="malla">
      <header className="malla__cabeza">
        <h1 className="malla__titulo">Malla curricular</h1>
        <span className="malla__cuenta">
          {aprobados} de {total} aprobados
        </span>
        <div className="malla__leyenda">
          {LEYENDA.map(({ estado, texto }) => (
            <span key={texto} className="malla__clave">
              <span
                className={`bloque bloque--mini ${
                  estado === 'x' ? 'bloque--x' : estado === 'brillo' ? 'bloque--brillo' : ''
                }`}
              />
              {texto}
            </span>
          ))}
        </div>
      </header>

      <div className="malla__lienzo">
        <div className="malla__cuadricula">
          {ANIOS.map((a) => (
            <span key={a} className="malla__anio">
              {a}
            </span>
          ))}

          {SEMESTRES.map((s) => (
            <span key={s.nombre} className="malla__sem">
              {s.nombre}
            </span>
          ))}

          {SEMESTRES.map((s) => (
            <div key={s.nombre} className="malla__columna">
              {s.ramos.map((r) => {
                const estado = malla[r.id]
                return (
                  <button
                    key={r.id}
                    className={`bloque ${
                      estado === 'x' ? 'bloque--x' : estado === 'brillo' ? 'bloque--brillo' : ''
                    }`}
                    onClick={() => avanzar(r.id)}
                    title={`${r.nombre} — ${
                      estado === 'x' ? 'aprobado' : estado === 'brillo' ? 'cursando' : 'pendiente'
                    }`}
                  >
                    {r.nombre}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
