import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Fase } from '../lib/reloj'
import { PIEL as TINTA } from './MonitosTinta'
import { PIEL as PIXEL } from './MonitosPixel'
import { pielFigura } from './MonitosFigura'

/**
 * Los monitos del margen: seis animalitos que pasean por la pantalla del
 * pomodoro. Este orquestador pone las capas de movimiento (paseo, volteo,
 * vuelo de Appa) y elige la piel — tinta, pixel, retro o kawaii — que rota
 * cada 15 minutos con un destello de transformación estilo padrinos mágicos.
 * Acuarela, papel, neón y plastilina comparten geometría (MonitosFigura) y se
 * diferencian sólo por CSS; tinta y pixel tienen su propio dibujo.
 * Las pieles comparten interfaz: reciben el ánimo y entregan el svg.
 * Duermen con el reloj parado, acompañan en foco y juegan en la pausa.
 */

export type Animo = 'estudia' | 'recreo' | 'siesta'
export type Animal = 'gatito' | 'perrito' | 'conejito' | 'ranita' | 'caracol' | 'cuy' | 'appa'
export type Estilo = 'tinta' | 'pixel' | 'acuarela' | 'papel' | 'neon' | 'plastilina'

export const animoDe = (fase: Fase, corriendo: boolean): Animo =>
  !corriendo ? 'siesta' : fase === 'foco' ? 'estudia' : 'recreo'

const PIELES: Record<Estilo, Record<Animal, (animo: Animo) => ReactNode>> = {
  tinta: TINTA,
  pixel: PIXEL,
  acuarela: pielFigura('acuarela'),
  papel: pielFigura('papel'),
  neon: pielFigura('neon'),
  plastilina: pielFigura('plastilina'),
}

/** Orden de la rotación: cada 15 minutos pasa a la siguiente. */
const ESTILOS: Estilo[] = ['tinta', 'acuarela', 'pixel', 'papel', 'plastilina', 'neon']

const ANIMALES: Animal[] = ['gatito', 'perrito', 'conejito', 'ranita', 'caracol', 'cuy', 'appa']

// OJO: modo prueba para revisar las pieles; volver a 15 * 60 * 1000.
const ROTACION = 5 * 1000
const POOF = 700

export function Monitos({ animo }: { animo: Animo }) {
  const [estilo, setEstilo] = useState<Estilo>('acuarela')
  const [poof, setPoof] = useState(false)
  const tPoof = useRef(0)

  useEffect(() => {
    const t = window.setInterval(() => {
      setEstilo((e) => ESTILOS[(ESTILOS.indexOf(e) + 1) % ESTILOS.length])
      setPoof(true)
      tPoof.current = window.setTimeout(() => setPoof(false), POOF)
    }, ROTACION)
    return () => {
      window.clearInterval(t)
      window.clearTimeout(tPoof.current)
    }
  }, [])

  const piel = PIELES[estilo]

  return (
    <>
      {ANIMALES.map((animal) => (
        <div key={animal} className={`mono mono--${animal}`} data-animo={animo} aria-hidden="true">
          <div className="mono__voltea">
            {animal === 'appa' ? (
              <div className="mono__ola">{piel[animal](animo)}</div>
            ) : (
              piel[animal](animo)
            )}
            {poof && <Destello />}
          </div>
        </div>
      ))}
    </>
  )
}

/** El poof de la transformación: estrellitas destacador que estallan y se van. */
function Destello() {
  return (
    <span className="mono__poof">
      {Array.from({ length: 8 }, (_, i) => (
        <i key={i} className="poof__chispa" />
      ))}
    </span>
  )
}
