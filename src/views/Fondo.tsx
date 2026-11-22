import { useEffect, useState } from 'react'
import { useReloj } from '../lib/reloj'
import type { Animo } from './Monitos'
import { Montana } from './Montana'
import { Pradera } from './Pradera'
import { cargarMontana, hayMontana, montanaLista, type ArteMontana } from './montanaArte'

/**
 * El fondo del Descanso. Si el arte de la montaña está entregado completo
 * (recursos/fondo/montana/, ver .ui-pipeline/06-fondo-montana.md) se muestra
 * esa escena; si falta el manifiesto, falta un PNG, o alguno no carga o no
 * mide lo pactado, queda la pradera por código de siempre. Así el arte puede
 * llegar de a poco desde Aseprite sin que la app se rompa nunca.
 */
export function Fondo({ animo }: { animo: Animo }) {
  // Cuánto va del bloque actual: con eso camina el sol (o la luna) de la montaña.
  const { restante, total } = useReloj()
  const progreso = total ? 1 - restante / total : 0
  const [arte, setArte] = useState<ArteMontana | 'cargando' | 'sin'>(() =>
    hayMontana() ? (montanaLista() ?? 'cargando') : 'sin',
  )

  useEffect(() => {
    if (arte !== 'cargando') return
    let vivo = true
    cargarMontana().then(
      (a) => vivo && setArte(a),
      (e) => {
        console.warn('[fondo] sigue la pradera:', e)
        if (vivo) setArte('sin')
      },
    )
    return () => {
      vivo = false
    }
  }, [arte])

  if (arte === 'sin') return <Pradera animo={animo} />
  // Mientras decodifica (unos milisegundos) no se pinta nada: mostrar la
  // pradera para cambiarla al instante sería un parpadeo.
  if (arte === 'cargando') return <div className="pradera" aria-hidden="true" />
  return <Montana animo={animo} arte={arte} progreso={progreso} />
}
