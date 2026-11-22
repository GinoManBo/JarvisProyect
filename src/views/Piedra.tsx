import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMovimientoReducido } from '../personajes/Personaje'
import { cargarPiedra, comoAnimacion, type AnimacionPiedra } from '../personajes/piedra'
import { Reproductor } from '../personajes/reproductor'
import { ANCLA, LIENZO } from '../personajes/tipos'

/**
 * La piedra hueca: pinta la animación que le dicta el motor con el mismo
 * reproductor de hojas de los monitos. Como ellos, la celda se muestra a un
 * múltiplo entero de sus píxeles y se compensa con el ancla, para que apoye en
 * el mismo suelo y sus píxeles midan lo mismo que los del cuy.
 */
export function PiedraSprite({ animacion, serie }: { animacion: AnimacionPiedra; serie: number }) {
  const caja = useRef<HTMLDivElement>(null)
  const capa = useRef<HTMLDivElement>(null)
  const repro = useRef<Reproductor | null>(null)
  const [tam, setTam] = useState(0)
  const reducido = useMovimientoReducido()

  useLayoutEffect(() => {
    const el = caja.current!
    const medir = () => setTam(Math.round(el.clientWidth))
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    repro.current = new Reproductor(capa.current!)
    return () => {
      repro.current?.destruir()
      repro.current = null
    }
  }, [])

  useEffect(() => {
    if (!tam) return
    let vigente = true
    cargarPiedra().then((est) => {
      if (!vigente || !repro.current) return
      const dpr = window.devicePixelRatio || 1
      const px = est.manifiesto.celdaPx
      const lado = (Math.max(1, Math.floor((tam * dpr) / px)) * px) / dpr
      Object.assign(capa.current!.style, {
        width: `${lado}px`,
        height: `${lado}px`,
        left: `${(ANCLA.x / LIENZO) * (tam - lado)}px`,
        top: `${(ANCLA.y / LIENZO) * (tam - lado)}px`,
      })
      repro.current.reproducir(est, comoAnimacion(animacion), { reducido })
    })
    return () => {
      vigente = false
    }
  }, [animacion, serie, tam, reducido])

  return (
    <div ref={caja} className="mono__fig mono__fig--sprite" style={{ position: 'relative' }}>
      <div ref={capa} style={{ position: 'absolute', backgroundRepeat: 'no-repeat' }} />
    </div>
  )
}
