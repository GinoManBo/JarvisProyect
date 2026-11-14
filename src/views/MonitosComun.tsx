import type { ReactNode } from 'react'
import type { Animal } from './Monitos'

/**
 * Piezas que comparten las tres pieles de los monitos (pluma, plumón, timbre):
 * el viewBox canónico de cada animal — igual en todas las pieles, para que la
 * caja, el carril y la pose no cambien al rotar — y el svg raíz.
 */

export type NombrePiel = 'pluma' | 'plumon' | 'timbre'

/** Apoyo en y=78, centrado en x=40. Appa es apaisado. */
export const CAJA: Record<Animal, string> = {
  gatito: '0 0 80 80',
  perrito: '0 0 80 80',
  conejito: '0 0 80 80',
  ranita: '0 0 80 80',
  caracol: '0 0 80 80',
  cuy: '0 0 80 80',
  appa: '0 0 120 64',
}

/** El svg raíz del monito. No lleva width ni height: lo manda la caja del carril. */
export function Fig({
  piel,
  animal,
  children,
}: {
  piel: NombrePiel
  animal: Animal
  children: ReactNode
}) {
  return (
    <svg className={`mono__fig mono__fig--${piel}`} viewBox={CAJA[animal]} focusable="false">
      {children}
    </svg>
  )
}

/** Una zeta de la siesta: sube y se desvanece sola (CSS, `mono-z`). */
export function Zeta({
  x,
  y,
  lejos,
}: {
  x: number
  y: number
  lejos?: boolean
}) {
  return (
    <text
      className={`mono__z ${lejos ? 'mono__z--lejos' : ''}`}
      x={x}
      y={y}
      fontSize={lejos ? 15 : 20}
    >
      z
    </text>
  )
}
