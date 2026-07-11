/**
 * La malla curricular de la carrera, tal como viene en el folleto: cinco años,
 * diez semestres. El id de cada ramo sale de su nombre (con contador para los
 * repetidos: los cuatro Electivos del semestre X) y es la llave con la que se
 * guarda su estado en la colección `malla` — no cambiar los nombres a la ligera,
 * que se pierden los estados marcados.
 */

export type RamoMalla = { id: string; nombre: string }
export type SemestreMalla = { nombre: string; ramos: RamoMalla[] }

/** Estado de un bloque: tachado con X roja o encendido en amarillo. */
export type EstadoMalla = 'x' | 'brillo'

export const ANIOS = ['1º Año', '2º Año', '3º Año', '4º Año', '5º Año']

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function semestre(nombre: string, nombres: string[], vistos: Map<string, number>): SemestreMalla {
  return {
    nombre,
    ramos: nombres.map((n) => {
      const base = slug(n)
      const veces = (vistos.get(base) ?? 0) + 1
      vistos.set(base, veces)
      return { id: veces === 1 ? base : `${base}-${veces}`, nombre: n }
    }),
  }
}

const vistos = new Map<string, number>()

export const SEMESTRES: SemestreMalla[] = [
  semestre('Sem I', [
    'Instituciones Políticas',
    'Economía y Contabilidad',
    'Complementario',
    'Introducción al Derecho I',
    'Derecho Romano I',
  ], vistos),
  semestre('Sem II', [
    'Fundamentos del Derecho Internacional Público',
    'Persona y Acto Jurídico',
    'Fundamentos del Derecho Procesal',
    'Introducción al Derecho II',
    'Derecho Romano II',
    'Historia Constitucional de Chile',
  ], vistos),
  semestre('Sem III', [
    'Fundamentos de Derecho Constitucional I',
    'Derechos Reales',
    'Derecho Procesal Orgánico',
    'Régimen Económico',
    'Teoría General del Derecho del Trabajo',
    'Historia del Derecho',
  ], vistos),
  semestre('Sem IV', [
    'Fundamentos de Derecho Constitucional II',
    'Teoría General de las Obligaciones',
    'Normas Comunes a Todo Procedimiento',
    'Introducción al Derecho Penal',
    'Contrato de Trabajo',
    'Expresión Jurídica I',
  ], vistos),
  semestre('Sem V', [
    'Teoría General de los Derechos Fundamentales',
    'Responsabilidad Civil y Prueba',
    'Procedimientos Declarativos Comunes',
    'Teoría del Delito',
    'Derecho Colectivo del Trabajo',
    'Negocios Jurídicos Mercantiles',
  ], vistos),
  semestre('Sem VI', [
    'Derecho Administrativo I',
    'Contratos Civiles',
    'Medios de Impugnación',
    'Iter Crimen, Participación Criminal y Determinación de la Sanción Penal',
    'Derecho Procesal del Trabajo',
    'Derecho Societario',
  ], vistos),
  semestre('Sem VII', [
    'Derecho Administrativo II',
    'Derecho de Familia',
    'Ejecución y Procedimientos Especiales',
    'Delitos Contra la Vida, la Integridad Corporal y la Libertad',
    'Seguridad Social',
    'Títulos de Crédito',
  ], vistos),
  semestre('Sem VIII', [
    'Derecho Tributario I',
    'Derecho Sucesorio',
    'Proceso Penal',
    'Delitos Contra la Propiedad',
    'Expresión Jurídica II',
    'Derecho Concursal',
  ], vistos),
  semestre('Sem IX', [
    'Derecho Tributario II',
    'Derecho Internacional Privado y Comparado',
    'Litigación',
    'Derecho Ambiental',
    'Investigación Jurídica',
    'Derecho Urbano',
  ], vistos),
  semestre('Sem X', [
    'Resolución Alternativa de Conflictos',
    'Filosofía del Derecho',
    'Memoria de Prueba (*)',
    'Electivo',
    'Electivo',
    'Electivo',
    'Electivo',
  ], vistos),
]
