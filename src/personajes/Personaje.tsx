import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { cargarEstilo } from './catalogo'
import { Reproductor } from './reproductor'
import {
  ANCLA,
  LIENZO,
  type Animal,
  type EstiloArte,
  type EstiloCargado,
  type NombreAnimacion,
} from './tipos'

/**
 * <Personaje>: un animal con arte pre-producido. Sabe de ESTILO y ANIMACIÓN
 * como dos ejes independientes; no sabe nada del Pomodoro (quien lo use
 * traduce el ánimo a una animación).
 *
 * Cuando cambia `estilo` con el personaje ya en pantalla, hace la transformación
 * poof: la nube del estilo de DESTINO crece, y en el cuadro `cubre` — con el
 * personaje oculto detrás — se cambian las hojas; en `libera` reaparece. La caja
 * y el ancla (ANCLA) no se tocan, así que ni la posición ni el tamaño saltan.
 */

type Props = {
  animal: Animal
  estilo: EstiloArte
  animacion: NombreAnimacion
  /** Lado de la caja en px CSS. */
  tam: number
  /** Cambiar de estilo con poof (por omisión sí). */
  poof?: boolean
  /** Fuerza el modo "reducir movimiento" (si no, sigue al sistema). */
  reducido?: boolean
  /** Diagnóstico: cada cambio de cuadro del cuerpo. */
  alPaso?: (info: { estilo: EstiloArte; animacion: NombreAnimacion; paso: number }) => void
  /** Se llama al terminar de transformar, o cuando aparece el estilo por primera vez. */
  alListo?: (estilo: EstiloArte) => void
  etiqueta?: string
}

export function useMovimientoReducido(forzar?: boolean): boolean {
  const consulta = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)'), [])
  const [sistema, setSistema] = useState(consulta.matches)
  useEffect(() => {
    const alCambiar = () => setSistema(consulta.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [consulta])
  return forzar ?? sistema
}

/** Pixel art: la celda se pinta a un múltiplo ENTERO de sus píxeles físicos (sin
    ese ajuste, los píxeles bailan). Se compensa con el ancla para que los pies
    caigan en el mismo punto que en cualquier otro estilo. */
function medidas(est: EstiloCargado, tam: number) {
  const m = est.manifiesto
  let lado = tam
  if (m.render === 'pixelado') {
    const dpr = window.devicePixelRatio || 1
    lado = (Math.max(1, Math.floor((tam * dpr) / m.celdaPx)) * m.celdaPx) / dpr
  }
  return {
    width: lado,
    height: lado,
    left: (ANCLA.x / LIENZO) * (tam - lado),
    top: (ANCLA.y / LIENZO) * (tam - lado),
  }
}

const capa: CSSProperties = { position: 'absolute', backgroundRepeat: 'no-repeat' }

export function Personaje({
  animal,
  estilo,
  animacion,
  tam,
  poof = true,
  reducido: reducidoForzado,
  alPaso,
  alListo,
  etiqueta,
}: Props) {
  const reducido = useMovimientoReducido(reducidoForzado)
  const cuerpoEl = useRef<HTMLDivElement>(null)
  const fxEl = useRef<HTMLDivElement>(null)
  const cuerpo = useRef<Reproductor | null>(null)
  const fx = useRef<Reproductor | null>(null)
  const mostrado = useRef<EstiloCargado | null>(null)
  const ronda = useRef(0)
  const cb = useRef({ alPaso, alListo })
  cb.current = { alPaso, alListo }

  useEffect(() => {
    cuerpo.current = new Reproductor(cuerpoEl.current!)
    fx.current = new Reproductor(fxEl.current!)
    return () => {
      cuerpo.current?.destruir()
      fx.current?.destruir()
      cuerpo.current = fx.current = null
    }
  }, [])

  useEffect(() => {
    const mia = ++ronda.current
    const vigente = () => ronda.current === mia
    const c = cuerpo.current!
    const f = fx.current!
    const cuerpoCss = cuerpoEl.current!.style
    const fxCss = fxEl.current!.style

    // Una ronda nueva corta la anterior: nube fuera, personaje visible.
    f.detener()
    fxCss.display = 'none'
    cuerpoCss.visibility = 'visible'

    const poner = (est: EstiloCargado) => {
      mostrado.current = est
      Object.assign(cuerpoCss, Object.fromEntries(Object.entries(medidas(est, tam)).map(([k, v]) => [k, `${v}px`])))
      c.reproducir(est, animacion, {
        reducido,
        alPaso: (paso) => cb.current.alPaso?.({ estilo: est.manifiesto.estilo, animacion, paso }),
      })
    }

    cargarEstilo(animal, estilo).then((destino) => {
      if (!vigente()) return
      const previo = mostrado.current
      const cambiaEstilo = previo && previo.manifiesto.estilo !== destino.manifiesto.estilo
      if (!cambiaEstilo || !poof || reducido) {
        poner(destino)
        if (!previo || cambiaEstilo) cb.current.alListo?.(estilo)
        return
      }
      // Transformación: sigue animando el estilo viejo hasta que la nube lo tape.
      Object.assign(fxCss, Object.fromEntries(Object.entries(medidas(destino, tam)).map(([k, v]) => [k, `${v}px`])))
      fxCss.display = 'block'
      f.reproducir(destino, 'poof', {
        alMarca: (marca) => {
          if (!vigente()) return
          if (marca === 'cubre') {
            cuerpoCss.visibility = 'hidden'
            poner(destino)
          } else if (marca === 'libera') {
            cuerpoCss.visibility = 'visible'
          }
        },
        alTerminar: () => {
          if (!vigente()) return
          fxCss.display = 'none'
          cuerpoCss.visibility = 'visible'
          cb.current.alListo?.(estilo)
        },
      })
    })
    // `tam` y `reducido` rehacen la ronda sin poof (el estilo ya es el mostrado).
  }, [animal, estilo, animacion, tam, poof, reducido])

  return (
    <div
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
      style={{ position: 'relative', width: tam, height: tam, flex: 'none' }}
    >
      <div ref={cuerpoEl} style={capa} />
      <div ref={fxEl} style={{ ...capa, display: 'none', pointerEvents: 'none' }} />
    </div>
  )
}
