import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Fase } from '../lib/reloj'
import { PIEL as PLUMA } from './MonitosPluma'
import { PIEL as PLUMON } from './MonitosPlumon'
import { PIEL as TIMBRE } from './MonitosTimbre'
import { MonitoSprite } from './MonitosSprite'
import { Pradera } from './Pradera'
import { tieneArte } from '../personajes/catalogo'

/**
 * Los monitos del margen: siete animalitos que acompañan el pomodoro. Este
 * orquestador pone las capas de movimiento y elige la piel — pluma, plumón o
 * timbre — que rota cada 15 minutos con un fundido, nunca mientras se estudia.
 *
 * DOM por animal (el carril es el `.mono`; la patrulla vive en CSS):
 *   .mono > .mono__paseo > .mono__voltea > [.mono__ola >] svg.mono__fig
 *
 * Las pieles comparten interfaz: reciben el ánimo y entregan el svg. Duermen
 * con el reloj parado, acompañan quietos en foco y juegan en la pausa.
 */

export type Animo = 'estudia' | 'recreo' | 'siesta'
export type Animal = 'gatito' | 'perrito' | 'conejito' | 'ranita' | 'caracol' | 'cuy' | 'appa'
export type Estilo = 'pluma' | 'plumon' | 'timbre'

export const animoDe = (fase: Fase, corriendo: boolean): Animo =>
  !corriendo ? 'siesta' : fase === 'foco' ? 'estudia' : 'recreo'

const PIELES: Record<Estilo, Record<Animal, (animo: Animo) => ReactNode>> = {
  pluma: PLUMA,
  plumon: PLUMON,
  timbre: TIMBRE,
}

/** Orden de la rotación: cada 15 minutos pasa a la siguiente. */
const ESTILOS: Estilo[] = ['pluma', 'plumon', 'timbre']

const ANIMALES: Animal[] = ['gatito', 'perrito', 'conejito', 'ranita', 'caracol', 'cuy', 'appa']

const ROTACION = 15 * 60 * 1000
const FUNDIDO = 700
const REVISION = 30 * 1000

/** Lo que sobrevive al desmontaje de Descanso: la piel puesta y desde cuándo.
    Vive a nivel de módulo (como el reloj vive sobre las secciones), para que
    cambiar de pestaña no reinicie el plazo de los 15 minutos. */
const memoria = { estilo: ESTILOS[0], ultimoCambio: Date.now() }

export function Monitos({ animo }: { animo: Animo }) {
  const [estilo, setEstilo] = useState<Estilo>(memoria.estilo)
  const [rota, setRota] = useState(false)
  const [oculto, setOculto] = useState(document.hidden)
  const animoRef = useRef(animo)
  const intentar = useRef<() => void>(() => {})
  const tFundido = useRef(0)

  // La rotación sólo ocurre fuera de foco y con la ventana a la vista; si el
  // plazo vence estudiando, queda pendiente hasta la pausa o la siesta.
  useEffect(() => {
    intentar.current = () => {
      if (animoRef.current === 'estudia' || document.hidden) return
      if (Date.now() - memoria.ultimoCambio < ROTACION) return
      memoria.estilo = ESTILOS[(ESTILOS.indexOf(memoria.estilo) + 1) % ESTILOS.length]
      memoria.ultimoCambio = Date.now()
      setEstilo(memoria.estilo)
      setRota(true)
      window.clearTimeout(tFundido.current)
      tFundido.current = window.setTimeout(() => setRota(false), FUNDIDO)
    }
    const alCambiarVista = () => {
      setOculto(document.hidden)
      intentar.current()
    }
    const t = window.setInterval(() => intentar.current(), REVISION)
    document.addEventListener('visibilitychange', alCambiarVista)
    return () => {
      window.clearInterval(t)
      window.clearTimeout(tFundido.current)
      document.removeEventListener('visibilitychange', alCambiarVista)
    }
  }, [])

  useEffect(() => {
    animoRef.current = animo
    intentar.current()
  }, [animo])

  const piel = PIELES[estilo]

  return (
    <>
      <Pradera animo={animo} />
      {ANIMALES.map((animal) => (
        <div
          key={animal}
          className={`mono mono--${animal}`}
          data-animo={animo}
          data-oculto={oculto ? '' : undefined}
          data-rota={rota ? '' : undefined}
          aria-hidden="true"
        >
          <div className="mono__paseo">
            {/* La llave por ánimo y piel rehace el voltea: el despertar, el
                brinquito y el fundido parten de cero en cada cambio, y el giro
                no queda a medias. */}
            <div className="mono__voltea" key={`${animo}-${estilo}`}>
              {tieneArte(animal, 'pixel') ? (
                <MonitoSprite animal={animal} animo={animo} />
              ) : animal === 'appa' ? (
                <div className="mono__ola">{piel[animal](animo)}</div>
              ) : (
                piel[animal](animo)
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

