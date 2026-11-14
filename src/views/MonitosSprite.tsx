import { useLayoutEffect, useRef, useState } from 'react'
import { Personaje } from '../personajes/Personaje'
import type { NombreAnimacion } from '../personajes/tipos'
import type { Animal, Animo } from './Monitos'

/**
 * Monito con arte pre-producido (hojas PNG dibujadas en Aseprite) en vez de
 * piel SVG: cualquier animal que ya tenga hojas en `recursos/personajes/<animal>/pixel/`. Se mete en el mismo carril que
 * las pieles (.mono__voltea): la patrulla y el volteo siguen siendo CSS; el
 * sprite pone la animación de cuadros.
 */

const ANIMACION: Record<Animo, NombreAnimacion> = {
  estudia: 'reposo',
  recreo: 'caminar',
  siesta: 'dormir',
}

export function MonitoSprite({ animal, animo }: { animal: Animal; animo: Animo }) {
  const caja = useRef<HTMLDivElement>(null)
  const [tam, setTam] = useState(0)

  // El ancho lo manda la caja del carril (--caja-ancho, que cambia con la
  // ventana); el reproductor necesita el lado en px para cuadrar los píxeles.
  useLayoutEffect(() => {
    const el = caja.current!
    const medir = () => setTam(Math.round(el.clientWidth))
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={caja} className="mono__fig mono__fig--sprite">
      {tam > 0 && <Personaje animal={animal} estilo="pixel" animacion={ANIMACION[animo]} tam={tam} />}
    </div>
  )
}
