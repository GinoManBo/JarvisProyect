export const CUMPLE = { mes: 11, dia: 9, anio: 2003 } // Javiera

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

/** YYYY-MM-DD en hora local (no UTC: `toISOString` corre la fecha hacia atrás en Chile). */
export function aClave(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function desdeClave(clave: string): Date {
  const [a, m, d] = clave.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export const hoyClave = () => aClave(new Date())

export function esCumple(clave: string): boolean {
  const d = desdeClave(clave)
  return d.getMonth() + 1 === CUMPLE.mes && d.getDate() === CUMPLE.dia
}

export function edadEn(clave: string): number {
  return desdeClave(clave).getFullYear() - CUMPLE.anio
}

/** Días entre hoy y una fecha. Negativo = ya pasó. */
export function diasHasta(clave: string): number {
  const hoy = desdeClave(hoyClave()).getTime()
  const fin = desdeClave(clave).getTime()
  return Math.round((fin - hoy) / 86_400_000)
}

export function textoCuentaRegresiva(clave: string): string {
  const d = diasHasta(clave)
  if (d < 0) return `hace ${Math.abs(d)} d`
  if (d === 0) return 'hoy'
  if (d === 1) return 'mañana'
  return `en ${d} días`
}

/** Semanas de un mes, empezando el lunes. Cada celda es una clave YYYY-MM-DD. */
export function cuadriculaMes(anio: number, mes: number): string[][] {
  const primero = new Date(anio, mes, 1)
  const desfase = (primero.getDay() + 6) % 7 // lunes = 0
  const inicio = new Date(anio, mes, 1 - desfase)

  const semanas: string[][] = []
  const cursor = new Date(inicio)
  for (let s = 0; s < 6; s++) {
    const semana: string[] = []
    for (let d = 0; d < 7; d++) {
      semana.push(aClave(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    semanas.push(semana)
    // Cortamos si ya pasamos el mes y la semana completa quedó fuera.
    if (cursor.getMonth() !== mes && cursor > new Date(anio, mes + 1, 0)) break
  }
  return semanas
}

export function formatoLargo(clave: string): string {
  const d = desdeClave(clave)
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}
