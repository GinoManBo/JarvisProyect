import { filas, pasos, type Animacion, type EstiloCargado, type NombreAnimacion } from './tipos'

/**
 * Reproductor de una capa: pinta un cuadro de una hoja o secuencia en un
 * elemento y avanza con duraciones variables. No sabe de estilos ni de Pomodoro:
 * recibe un EstiloCargado y un nombre de animación. Sólo toca `backgroundImage`,
 * `backgroundSize` y `backgroundPosition`, y únicamente cuando cambia el cuadro
 * (~10 veces por segundo); no hay rAF ni trabajo entre cuadros.
 */

export type OpcionesReproduccion = {
  /** Se llama al llegar a una marca (`cubre`, `libera`, …) con su nombre. */
  alMarca?: (nombre: string) => void
  /** Se llama en cada cambio de cuadro (diagnóstico y demo; no usar para pintar). */
  alPaso?: (paso: number, cuadro: number) => void
  /** Se llama al terminar una animación sin bucle. */
  alTerminar?: () => void
  /** Con "reducir movimiento": muestra el cuadro `fijo` y no corre. */
  reducido?: boolean
}

export class Reproductor {
  private temporizador = 0
  private paso = 0
  private meta = 0
  private anim: Animacion | null = null
  private estilo: EstiloCargado | null = null
  private nombre: NombreAnimacion | null = null
  private opc: OpcionesReproduccion = {}
  private corriendo = false

  constructor(private el: HTMLElement) {
    document.addEventListener('visibilitychange', this.alCambiarVista)
  }

  destruir() {
    this.detener()
    document.removeEventListener('visibilitychange', this.alCambiarVista)
  }

  get animacionActual() {
    return this.nombre
  }

  get pasoActual() {
    return this.paso
  }

  reproducir(estilo: EstiloCargado, nombre: NombreAnimacion, opc: OpcionesReproduccion = {}) {
    this.detener()
    this.estilo = estilo
    this.nombre = nombre
    this.anim = estilo.manifiesto.animaciones[nombre]
    this.opc = opc
    this.el.style.imageRendering = estilo.manifiesto.render === 'pixelado' ? 'pixelated' : 'auto'
    this.paso = opc.reducido ? (this.anim.fijo ?? 0) : 0
    this.pintar()
    if (opc.reducido) return
    this.corriendo = true
    this.meta = performance.now() + this.anim.duraciones[0]
    this.marcar()
    this.programar()
  }

  detener() {
    this.corriendo = false
    window.clearTimeout(this.temporizador)
  }

  private alCambiarVista = () => {
    // Oculta la ventana, se congela el reloj de cuadros; al volver se retoma sin ráfaga.
    if (!this.anim || this.opc.reducido || !this.corriendo) return
    window.clearTimeout(this.temporizador)
    if (!document.hidden) {
      this.meta = performance.now() + this.anim.duraciones[this.paso]
      this.programar()
    }
  }

  private programar() {
    if (document.hidden) return
    const espera = Math.max(0, this.meta - performance.now())
    this.temporizador = window.setTimeout(this.avanzar, espera)
  }

  private avanzar = () => {
    const a = this.anim
    if (!a || !this.corriendo) return
    let siguiente = this.paso + 1
    if (siguiente >= a.duraciones.length) {
      if (!a.bucle) {
        this.corriendo = false
        this.opc.alTerminar?.()
        return
      }
      siguiente = 0
    }
    this.paso = siguiente
    this.pintar()
    this.marcar()
    // Se acumula sobre la meta anterior: el desfase de un timer no se arrastra.
    // Si se atrasó más de un cuadro (pestaña dormida), se resincroniza.
    const ahora = performance.now()
    this.meta += a.duraciones[this.paso]
    if (this.meta < ahora - 50) this.meta = ahora + a.duraciones[this.paso]
    this.programar()
  }

  private marcar() {
    const marcas = this.anim?.marcas
    if (!marcas || !this.opc.alMarca) return
    for (const [n, p] of Object.entries(marcas)) if (p === this.paso) this.opc.alMarca(n)
  }

  private pintar() {
    const a = this.anim!
    const cuadro = pasos(a)[this.paso]
    const f = a.fuente
    const estilo = this.el.style
    this.opc.alPaso?.(this.paso, cuadro)
    estilo.backgroundImage = `url("${this.estilo!.urls[this.nombre!][cuadro]}")`
    if (f.tipo === 'hoja') {
      const nf = filas(f)
      const c = cuadro % f.columnas
      const r = Math.floor(cuadro / f.columnas)
      estilo.backgroundSize = `${f.columnas * 100}% ${nf * 100}%`
      estilo.backgroundPosition = `${f.columnas > 1 ? (c / (f.columnas - 1)) * 100 : 0}% ${nf > 1 ? (r / (nf - 1)) * 100 : 0}%`
    } else {
      estilo.backgroundSize = '100% 100%'
      estilo.backgroundPosition = '0 0'
    }
  }
}
