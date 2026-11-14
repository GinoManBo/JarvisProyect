import { createRoot } from 'react-dom/client'
import '/src/estilos.css'
import { PIEL as PLUMA } from '/src/views/MonitosPluma'
import { PIEL as PLUMON } from '/src/views/MonitosPlumon'
import { PIEL as TIMBRE } from '/src/views/MonitosTimbre'

const animales = ['conejito', 'gatito', 'cuy', 'caracol', 'perrito', 'ranita', 'appa'] as const
const animos = ['estudia', 'recreo', 'siesta'] as const
const q = new URLSearchParams(location.search)
const ancho = q.get('w') || '200'
document.documentElement.style.setProperty('--w', ancho + 'px')
document.documentElement.dataset.tema = q.get('tema') || 'claro'
const PIEL = ({ pluma: PLUMA, plumon: PLUMON, timbre: TIMBRE } as const)[(q.get('piel') || 'pluma') as 'pluma']
const solo = q.get('animal')
const lista = solo ? animales.filter((a) => a === solo) : animales

createRoot(document.getElementById('raiz')!).render(
  <div className="rejilla" style={{ ['--cols' as string]: 3 }}>
    {lista.flatMap((a) =>
      animos.map((o) => (
        <div className="celda" key={a + o}>
          <small>{a} · {o}</small>
          <div
            className={`mono mono--${a}`}
            data-animo={o}
            style={a === 'appa' ? { ['--w' as string]: String(Number(ancho) * 1.2) + 'px' } : undefined}
          >
            {PIEL[a](o)}
          </div>
        </div>
      )),
    )}
  </div>,
)
