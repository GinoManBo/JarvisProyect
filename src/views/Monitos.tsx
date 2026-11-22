import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { Fase } from '../lib/reloj'
import { PIEL as PLUMA } from './MonitosPluma'
import { PIEL as PLUMON } from './MonitosPlumon'
import { PIEL as TIMBRE } from './MonitosTimbre'
import { MonitoSprite } from './MonitosSprite'
import { Fondo } from './Fondo'
import { manifiestoDe, tieneArte } from '../personajes/catalogo'
import { useMovimientoReducido } from '../personajes/Personaje'
import {
  arrastrar,
  arrastrarPiedra,
  avanzar,
  cambiarAnimo,
  crearMundo,
  enCalma,
  fijarReducido,
  medir,
  reanudar,
  rozarPiedra,
  soltar,
  soltarPiedra,
  tomar,
  tomarPiedra,
  type Animo,
  type Mundo,
  type Zona,
} from '../personajes/motor'
import { tiemposDe, type NombreAnimacion, type Tiempos } from '../personajes/tipos'
import { alCambiarLuz, luz } from '../lib/sol'
import { tiemposPiedra, type AnimacionPiedra } from '../personajes/piedra'
import { PiedraSprite } from './Piedra'

/**
 * Los monitos del margen: siete animalitos que acompañan el pomodoro. Dónde
 * está cada uno y qué hace lo decide el motor (src/personajes/motor.ts): pasean
 * cada uno a su manera, juegan entre ellos en el recreo, duermen en la siesta
 * y se pueden tomar y lanzar con el puntero. Este componente sólo mide el área,
 * corre el motor en cada cuadro y pinta: la posición va por `transform` directo
 * al DOM (nunca por estado de React); a React sólo llega el cambio de animación.
 *
 * DOM por animal:
 *   .mono (posición) > .mono__voltea (giro y péndulo) > sprite | [.mono__ola >] svg
 *                    > .mono__agarre (la zona que se puede tomar)
 *   .sombra > .sombra__proy + .sombra__pie   (una por animal y una de la piedra, antes de los .mono)
 *   .mono.mono--piedra > sprite + .mono__agarre   (la piedra hueca del cuy, detrás de los animales)
 *
 * Las sombras se quedan en el suelo aunque el animal suba: son hermanas de los
 * .mono, no hijas. La de contacto va siempre bajo las patas; la proyectada se
 * alarga y se corre al lado contrario de la luz que publica el fondo
 * (src/lib/sol.ts): larga con el sol bajo, corta con el sol alto, más tenue y
 * ancha si la montaña tapa la luz. En el aire se encogen y se aclaran.
 *
 * Los que tienen hojas pixel muestran sus cuadros; los que no, su piel SVG —
 * pluma, plumón o timbre, que rota cada 15 minutos con un fundido, nunca
 * mientras se estudia — con la pose que más se parece a lo que hacen.
 */

export type { Animo }
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
const memoria = { estilo: ESTILOS[0], ultimoCambio: Date.now(), mundo: null as Mundo | null }

/** Cuánto de la caja ocupa la silueta a lo ancho (Appa llena su celda). */
const ANCHO_SOMBRA: Record<Animal, number> = {
  gatito: 0.5, perrito: 0.54, conejito: 0.46, ranita: 0.46, caracol: 0.5, cuy: 0.5, appa: 0.84,
}
/** Las piezas del reloj (Descanso.tsx) que los monitos esquivan: hermanas del área. */
const ZONAS_RELOJ = ['.reloj__rotulo', '.anillo', '.reloj__placa']
const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
/** A píxel par: la elipse de escalones no tolera medios píxeles. */
const par = (v: number) => Math.max(2, Math.round(v / 2) * 2)

const tiempos = () =>
  Object.fromEntries(ANIMALES.map((a) => [a, tiemposDe(manifiestoDe(a, 'pixel'))])) as Record<Animal, Tiempos>

type Vista = Record<Animal, { animacion: NombreAnimacion; serie: number }>

/** La pose de la piel SVG que mejor cuenta lo que hace el motor. */
const poseDe = (a: NombreAnimacion): Animo =>
  a === 'dormir' ? 'siesta' : a === 'reposo' || a === 'reaccion' ? 'estudia' : 'recreo'


export function Monitos({ animo }: { animo: Animo }) {
  const [estilo, setEstilo] = useState<Estilo>(memoria.estilo)
  const [rota, setRota] = useState(false)
  const [oculto, setOculto] = useState(document.hidden)
  const reducido = useMovimientoReducido()
  const animoRef = useRef(animo)
  const intentar = useRef<() => void>(() => {})
  const tFundido = useRef(0)

  // El mundo vive a nivel de módulo, como la piel: al volver a Descanso cada
  // uno sigue donde quedó.
  const mundo = (memoria.mundo ??= crearMundo(tiempos(), tiemposPiedra()))
  const [vista, setVista] = useState<Vista>(
    () => Object.fromEntries(ANIMALES.map((a) => [a, { animacion: animo === 'siesta' ? 'dormir' : 'reposo', serie: -1 }])) as Vista,
  )
  const area = useRef<HTMLDivElement>(null)
  const cajas = useRef<Partial<Record<Animal, HTMLDivElement>>>({})
  const volteos = useRef<Partial<Record<Animal, HTMLDivElement>>>({})
  const sombras = useRef<Partial<Record<Animal | 'piedra', HTMLDivElement>>>({})
  const sombraPintada = useRef<Partial<Record<Animal | 'piedra', string>>>({})
  const cajaPiedra = useRef<HTMLDivElement>(null)
  const piedraPintada = useRef<{ caja?: string; tomada?: boolean; serie?: number }>({})
  const [vistaPiedra, setVistaPiedra] = useState<{ animacion: AnimacionPiedra; serie: number }>({ animacion: 'vacia', serie: -1 })
  const pintado = useRef<Partial<Record<Animal, { caja?: string; giro?: string; mira?: number; tomado?: boolean; encima?: boolean; escondido?: boolean }>>>({})
  const despertar = useRef<() => void>(() => {})
  const serieVista = useRef<Partial<Record<Animal, number>>>({})
  const reducidoRef = useRef(reducido)

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

  // El motor: medir, avanzar y pintar. El bucle se duerme cuando no hay nada
  // que mover (todos dormidos, o movimiento reducido) y `despertar` lo retoma.
  useLayoutEffect(() => {
    const el = area.current!
    let cuadro = 0
    let previo = 0

    const medirTodo = () => {
      let suelo = mundo.suelo
      const medidas = {} as Record<Animal, { ancho: number; alto: number; dibujo: number }>
      const dpr = window.devicePixelRatio || 1
      for (const a of ANIMALES) {
        const c = cajas.current[a]
        const ancho = c?.offsetWidth ?? 0
        // La hoja pixel se pinta a un múltiplo entero de 64 px físicos (como en
        // Personaje.tsx): ése es el tamaño real del dibujo dentro de la caja.
        const dibujo = tieneArte(a, 'pixel') ? (Math.max(1, Math.floor((ancho * dpr) / 64)) * 64) / dpr : ancho
        medidas[a] = { ancho, alto: c?.offsetHeight ?? 0, dibujo }
        // El suelo es el `bottom` de la caja (--mono-suelo), ya resuelto en px.
        if (c && medidas[a].ancho) suelo = parseFloat(getComputedStyle(c).bottom) || suelo
      }
      const cp = cajaPiedra.current
      // Lo que los monitos no deben tapar por su cuenta: el rótulo, el disco y la
      // placa de mandos, en coordenadas del motor (x del área; altura sobre el suelo).
      const marco = el.getBoundingClientRect()
      const zonas: Zona[] = []
      for (const sel of ZONAS_RELOJ) {
        const z = el.parentElement?.querySelector(sel)?.getBoundingClientRect()
        if (!z || !z.width || !z.height) continue
        zonas.push({ x0: z.left - marco.left, x1: z.right - marco.left, y0: marco.bottom - suelo - z.bottom, y1: marco.bottom - suelo - z.top })
      }
      medir(mundo, el.clientWidth, el.clientHeight, suelo, medidas, { ancho: cp?.offsetWidth ?? 0, alto: cp?.offsetHeight ?? 0 }, zonas)
    }

    // La sombra de un bulto de ancho `w` y alto `h` (px) con el centro en `x` y
    // las patas a `altura` px del suelo. Escribe sólo si algo cambió.
    const sombrear = (el: HTMLDivElement | undefined, clave: Animal | 'piedra', visible: boolean, x: number, altura: number, w: number, h: number) => {
      if (!el) return
      const pie = el.children[1] as HTMLElement
      const proy = el.children[0] as HTMLElement
      if (!visible) {
        if (sombraPintada.current[clave] !== '') {
          sombraPintada.current[clave] = ''
          el.style.visibility = 'hidden'
        }
        return
      }
      const l = luz()
      // En el aire: más chica y más tenue (a tres cajas de altura, la mitad), pero
      // nunca desaparece: Appa en lo alto sigue marcando dónde va.
      const cerca = 1 / (1 + Math.max(0, altura) / (h * 3))
      const talla = 0.5 + 0.5 * cerca
      // Hacia dónde cae: al lado contrario de la luz; casi nada si está tapada.
      const lado = acotar((x / Math.max(1, mundo.ancho) - l.x) * 6, -1, 1) * (l.tapada ? 0.25 : 1)
      const bajo = Math.pow(1 - acotar(l.altura, 0, 1), 1.4) // 0 = sol en el cénit, 1 = en el horizonte
      const largo = h * (0.12 + 1.25 * bajo) * Math.abs(lado)
      const grueso = par(Math.max(4, h * 0.11) * talla)
      const anchoPie = par(w * 0.82 * talla)
      const anchoProy = par((w * (l.tapada ? 1.25 : 1) + largo) * talla)
      // El animal en el aire: su sombra proyectada se aleja un poco más.
      const corre = Math.round(lado * (largo / 2 + Math.min(h, Math.max(0, altura)) * 0.35 * bajo))
      const ladeo = Math.round(-lado * bajo * 38)
      const opProy = (l.tapada ? 0.55 : 1) * 0.4 * acotar(l.intensidad, 0, 1) * (0.35 + 0.65 * cerca)
      const opPie = (0.3 + 0.2 * acotar(l.intensidad, 0, 1)) * (0.4 + 0.6 * cerca)
      // Las patas pisan a 4/64 de la caja sobre su borde de abajo; la elipse se centra ahí.
      const base = Math.round(mundo.suelo + h * (4 / 64))
      const firma = `${Math.round(x)}|${base}|${anchoPie}|${anchoProy}|${grueso}|${corre}|${ladeo}|${opProy.toFixed(2)}|${opPie.toFixed(2)}`
      if (sombraPintada.current[clave] === firma) return
      sombraPintada.current[clave] = firma
      el.style.visibility = 'visible'
      el.style.transform = `translate3d(${Math.round(x)}px,${-base}px,0)`
      pie.style.transform = `translate3d(${-16}px,${4}px,0) scale(${anchoPie / 32},${grueso / 8})`
      pie.style.opacity = opPie.toFixed(2)
      proy.style.transform = `translate3d(${corre - 16}px,${4}px,0) skewX(${ladeo}deg) scale(${anchoProy / 32},${grueso / 8})`
      proy.style.opacity = opProy.toFixed(2)
    }

    const pintar = () => {
      let cambios: Partial<Vista> | null = null
      for (const m of mundo.lista) {
        const c = cajas.current[m.animal]
        const v = volteos.current[m.animal]
        // Acostado sobre otro no echa sombra propia en el suelo (la del de abajo basta).
        sombrear(sombras.current[m.animal], m.animal, m.presente && !m.sobre && !m.oculto, m.x, m.y + m.bamboleo, m.ancho * ANCHO_SOMBRA[m.animal], m.alto)
        if (!c || !v || !m.presente) continue
        const p = (pintado.current[m.animal] ??= {})
        // A píxel entero: el pixel art no tolera medias posiciones.
        const caja = `translate3d(${Math.round(m.x - m.ancho / 2)}px,${Math.round(-(m.y + m.bamboleo))}px,0)`
        if (p.caja !== caja) c.style.transform = p.caja = caja
        const giro = `rotate(${m.inclinacion.toFixed(1)}deg) scaleX(${m.mira})`
        if (p.giro !== giro) v.style.transform = p.giro = giro
        // Las zetas de la piel SVG se desvoltean con --mira para no leerse al revés.
        if (p.mira !== m.mira) v.style.setProperty('--mira', String((p.mira = m.mira)))
        const tomado = m.estado === 'colgar'
        if (p.tomado !== tomado) c.toggleAttribute('data-tomado', (p.tomado = tomado))
        // Acostado sobre otro, o colgado del marco: se pinta por delante.
        const encima = m.sobre !== null || m.estado === 'trepar'
        if (p.encima !== encima) c.toggleAttribute('data-encima', (p.encima = encima))
        if (c.style.visibility !== 'visible') c.style.visibility = 'visible'
        // El cuy metido en la piedra no se pinta (ni se puede tomar).
        if (p.escondido !== m.oculto) c.toggleAttribute('data-escondido', (p.escondido = m.oculto))
        if (m.serie !== serieVista.current[m.animal]) {
          serieVista.current[m.animal] = m.serie
          ;(cambios ??= {})[m.animal] = { animacion: m.animacion, serie: m.serie }
        }
      }
      if (cambios) {
        const nuevos = cambios
        setVista((antes) => ({ ...antes, ...nuevos }))
      }
      // La piedra: posición, sombra (más baja que su celda: mide ~0,6) y animación.
      const pi = mundo.piedra
      const cp = cajaPiedra.current
      sombrear(sombras.current.piedra, 'piedra', pi.presente, pi.x, pi.y, pi.ancho * 0.8, pi.alto * 0.62)
      if (cp && pi.presente) {
        const pp = piedraPintada.current
        const caja = `translate3d(${Math.round(pi.x - pi.ancho / 2)}px,${Math.round(-pi.y)}px,0)`
        if (pp.caja !== caja) cp.style.transform = pp.caja = caja
        const tomada = pi.estado === 'colgar'
        if (pp.tomada !== tomada) cp.toggleAttribute('data-tomado', (pp.tomada = tomada))
        if (cp.style.visibility !== 'visible') cp.style.visibility = 'visible'
        if (pp.serie !== pi.serie) {
          pp.serie = pi.serie
          setVistaPiedra({ animacion: pi.animacion, serie: pi.serie })
        }
      }
    }

    const bucle = (ahora: number) => {
      avanzar(mundo, ahora - previo)
      previo = ahora
      pintar()
      cuadro = enCalma(mundo) ? 0 : requestAnimationFrame(bucle)
    }
    despertar.current = () => {
      if (cuadro) return
      previo = performance.now()
      cuadro = requestAnimationFrame(bucle)
    }

    reanudar(mundo, animoRef.current, reducidoRef.current, tiempos())
    medirTodo()
    pintar()
    despertar.current()

    const obs = new ResizeObserver(() => {
      medirTodo()
      pintar()
      despertar.current()
    })
    obs.observe(el)
    // La luz se mueve aunque los monitos duerman: las sombras la siguen igual.
    const sinLuz = alCambiarLuz(() => pintar())
    return () => {
      obs.disconnect()
      sinLuz()
      cancelAnimationFrame(cuadro)
      despertar.current = () => {}
    }
  }, [mundo])

  useEffect(() => {
    animoRef.current = animo
    cambiarAnimo(mundo, animo)
    despertar.current()
    intentar.current()
  }, [animo, mundo])

  useEffect(() => {
    reducidoRef.current = reducido
    fijarReducido(mundo, reducido)
    despertar.current()
  }, [reducido, mundo])

  // Tomar y arrastrar. Sólo la zona de agarre recibe el clic, así que el resto
  // de Descanso sigue funcionando donde no hay animal. El puntero se captura
  // (el cursor no cambia al pasar sobre otra cosa) y, además, el movimiento y
  // la suelta se escuchan en la ventana: si la captura se pierde, igual lo suelta.
  const dejar = useRef<() => void>(() => {})
  useEffect(() => () => dejar.current(), [])

  const alTomar = (animal: Animal) => (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    dejar.current()
    const id = e.pointerId
    const zona = e.currentTarget
    const enArea = (ev: { clientX: number; clientY: number }) => {
      const r = area.current!.getBoundingClientRect()
      return [ev.clientX - r.left, ev.clientY - r.top] as const
    }
    try {
      zona.setPointerCapture(id)
    } catch {
      // Sin captura (puntero ya inactivo) siguen los oyentes de la ventana.
    }
    const mover = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId === id) arrastrar(mundo, animal, ...enArea(ev), ev.timeStamp)
    }
    const fin = (ev: Event) => {
      if (ev instanceof globalThis.PointerEvent && ev.pointerId !== id) return
      dejar.current()
    }
    dejar.current = () => {
      dejar.current = () => {}
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', fin)
      window.removeEventListener('pointercancel', fin)
      window.removeEventListener('blur', fin)
      if (zona.hasPointerCapture(id)) zona.releasePointerCapture(id)
      soltar(mundo, animal, performance.now())
      despertar.current()
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', fin)
    window.addEventListener('pointercancel', fin)
    window.addEventListener('blur', fin)
    tomar(mundo, animal, ...enArea(e), e.timeStamp)
    despertar.current()
  }

  // La piedra se toma igual que un animal; un clic sin arrastre es un toque
  // (lo distingue el motor al soltarla) y pasarle el puntero hace asomarse al cuy.
  const alTomarPiedra = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    dejar.current()
    const id = e.pointerId
    const zona = e.currentTarget
    const enArea = (ev: { clientX: number; clientY: number }) => {
      const r = area.current!.getBoundingClientRect()
      return [ev.clientX - r.left, ev.clientY - r.top] as const
    }
    try {
      zona.setPointerCapture(id)
    } catch {
      // Sin captura siguen los oyentes de la ventana.
    }
    const mover = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId === id) arrastrarPiedra(mundo, ...enArea(ev), ev.timeStamp)
    }
    const fin = (ev: Event) => {
      if (ev instanceof globalThis.PointerEvent && ev.pointerId !== id) return
      dejar.current()
    }
    dejar.current = () => {
      dejar.current = () => {}
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', fin)
      window.removeEventListener('pointercancel', fin)
      window.removeEventListener('blur', fin)
      if (zona.hasPointerCapture(id)) zona.releasePointerCapture(id)
      soltarPiedra(mundo, performance.now())
      despertar.current()
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', fin)
    window.addEventListener('pointercancel', fin)
    window.addEventListener('blur', fin)
    tomarPiedra(mundo, ...enArea(e), e.timeStamp)
    despertar.current()
  }
  const alRozarPiedra = () => {
    rozarPiedra(mundo)
    despertar.current()
  }

  const piel = PIELES[estilo]

  return (
    <>
      <Fondo animo={animo} />
      <div className="monos" ref={area}>
        {ANIMALES.map((animal) => (
          <div
            key={`sombra-${animal}`}
            className="sombra"
            aria-hidden="true"
            ref={(el) => {
              if (el) sombras.current[animal] = el
              else delete sombras.current[animal]
              delete sombraPintada.current[animal]
            }}
          >
            <i className="sombra__proy" />
            <i className="sombra__pie" />
          </div>
        ))}
        <div
          className="sombra"
          aria-hidden="true"
          ref={(el) => {
            if (el) sombras.current.piedra = el
            else delete sombras.current.piedra
            delete sombraPintada.current.piedra
          }}
        >
          <i className="sombra__proy" />
          <i className="sombra__pie" />
        </div>
        <div ref={cajaPiedra} className="mono mono--piedra" data-oculto={oculto ? '' : undefined} aria-hidden="true">
          <PiedraSprite animacion={vistaPiedra.animacion} serie={vistaPiedra.serie} />
          <div className="mono__agarre" onPointerDown={alTomarPiedra} onPointerEnter={alRozarPiedra} />
        </div>
        {ANIMALES.map((animal) => {
          const arte = tieneArte(animal, 'pixel')
          const { animacion, serie } = vista[animal]
          const pose = poseDe(animacion)
          return (
            <div
              key={animal}
              ref={(el) => {
                if (el) cajas.current[animal] = el
                else delete cajas.current[animal]
                delete pintado.current[animal]
              }}
              className={`mono mono--${animal}`}
              data-animo={arte ? animo : pose}
              data-reloj={animo}
              data-oculto={oculto ? '' : undefined}
              data-rota={rota ? '' : undefined}
              aria-hidden="true"
            >
              {/* La llave por piel rehace el voltea: el fundido del cambio de
                  piel parte de cero. El giro lo vuelve a poner el motor. */}
              <div
                className="mono__voltea"
                key={arte ? 'hojas' : estilo}
                ref={(el) => {
                  if (el) volteos.current[animal] = el
                  else delete volteos.current[animal]
                  const p = pintado.current[animal]
                  if (p) p.giro = p.mira = undefined
                }}
              >
                {arte ? (
                  <MonitoSprite animal={animal} animacion={animacion} serie={serie} />
                ) : animal === 'appa' ? (
                  <div className="mono__ola">{piel[animal](pose)}</div>
                ) : (
                  piel[animal](pose)
                )}
              </div>
              <div
                className="mono__agarre"
                onPointerDown={alTomar(animal)}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
