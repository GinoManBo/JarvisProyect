import { useCallback, useEffect, useRef, useState } from 'react'

export type FichaCodigo = {
  slug: string
  sigla: string
  nombre: string
  articulos: number
}

export type Articulo = {
  num: number | null
  etiqueta: string
  transitorio: boolean
  texto: string
  ubicacion: string
  slug: string
  sigla: string
}

type Puente = {
  leer: (col: string) => Promise<unknown>
  guardar: (col: string, data: unknown) => Promise<void>
  exportar: () => Promise<string | null>
  respaldar: () => Promise<string>
  abrirCarpeta: () => Promise<string>
  avisar: (titulo: string, cuerpo: string) => Promise<void>
  codigos: () => Promise<FichaCodigo[]>
  buscarArticulos: (slug: string, consulta: string) => Promise<Articulo[]>
}

declare global {
  interface Window {
    jarvis?: Puente
  }
}

// Fuera de Electron (p. ej. `vite preview` en el navegador) caemos a localStorage
// para poder desarrollar la UI sin levantar la app completa.
const respaldoNavegador: Puente = {
  leer: async (col) => {
    const raw = localStorage.getItem(`jarvis:${col}`)
    return raw ? JSON.parse(raw) : null
  },
  guardar: async (col, data) => {
    localStorage.setItem(`jarvis:${col}`, JSON.stringify(data))
  },
  exportar: async () => null,
  respaldar: async () => '',
  abrirCarpeta: async () => '',
  avisar: async (titulo, cuerpo) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, { body: cuerpo })
    }
  },
  // Los códigos los sirve el proceso main leyendo `recursos/codigos/`; fuera de
  // Electron no hay de dónde sacarlos.
  codigos: async () => [],
  buscarArticulos: async () => [],
}

export const puente = (): Puente => window.jarvis ?? respaldoNavegador

/**
 * Colección persistida. Lee una vez al montar y guarda (con rebote) en cada cambio.
 */
export function useColeccion<T>(nombre: string, inicial: T) {
  const [datos, setDatos] = useState<T>(inicial)
  const [listo, setListo] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    let vivo = true
    puente()
      .leer(nombre)
      .then((guardado) => {
        if (!vivo) return
        if (guardado !== null && guardado !== undefined) setDatos(guardado as T)
        setListo(true)
      })
    return () => {
      vivo = false
    }
  }, [nombre])

  useEffect(() => {
    if (!listo) return
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      void puente().guardar(nombre, datos)
    }, 300)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [datos, listo, nombre])

  const actualizar = useCallback((f: (prev: T) => T) => setDatos(f), [])

  return [datos, actualizar, listo] as const
}

export const id = () => crypto.randomUUID()
export const ahora = () => new Date().toISOString()
