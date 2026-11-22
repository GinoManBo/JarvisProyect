import { useLayoutEffect, useRef, useState } from 'react'
import { Personaje } from '../personajes/Personaje'
import type { NombreAnimacion } from '../personajes/tipos'
import type { Animal } from './Monitos'

/**
 * Monito con arte pre-producido (hojas PNG dibujadas en Aseprite) en vez de
 * piel SVG: cualquier animal que ya tenga hojas en
 * `recursos/personajes/<animal>/pixel/`. Qué animación toca lo decide el motor
 * (Monitos.tsx se la pasa); `serie` cambia cada vez que una animación vuelve a
 * empezar, aunque sea la misma. Si al animal le falta alguna de las nuevas
 * (colgar, caer, jugar, reaccion), el reproductor muestra `reposo`.
 */

export function MonitoSprite({
  animal,
  animacion,
  serie,
}: {
  animal: Animal
  animacion: NombreAnimacion
  serie: number
}) {
  const caja = useRef<HTMLDivElement>(null)
  const [tam, setTam] = useState(0)

  // El ancho lo manda la caja (--caja-ancho, que cambia con la ventana); el
  // reproductor necesita el lado en px para cuadrar los píxeles.
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
      {tam > 0 && <Personaje animal={animal} estilo="pixel" animacion={animacion} serie={serie} tam={tam} />}
    </div>
  )
}
