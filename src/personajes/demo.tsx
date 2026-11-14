import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../estilos.css'
import { PIEL as PLUMA } from '../views/MonitosPluma'
import { PIEL as PLUMON } from '../views/MonitosPlumon'
import { PIEL as TIMBRE } from '../views/MonitosTimbre'
import type { Animo } from '../views/Monitos'
import { Personaje } from './Personaje'
import { ANCLA, LIENZO, type EstiloArte, type NombreAnimacion } from './tipos'

/**
 * Demo independiente (no está enlazada en la app): compara el gatito de SVG+CSS
 * de hoy con el reproductor de hojas, con el mismo ánimo y el mismo tamaño.
 * Mientras los PNG sean las hojas GUÍA, el lado nuevo muestra la plantilla
 * técnica, no arte: sirve para validar reproducción, tiempos, ancla y poof.
 */

type Anim = Exclude<NombreAnimacion, 'poof'>
const ANIMO: Record<Anim, Animo> = { reposo: 'estudia', caminar: 'recreo', dormir: 'siesta' }

const q = new URLSearchParams(location.search)
document.documentElement.dataset.tema = q.get('tema') || 'claro'

function Demo() {
  const [anim, setAnim] = useState<Anim>((q.get('anim') as Anim) || 'reposo')
  const [tam, setTam] = useState(Number(q.get('tam')) || 128)
  const [fondo, setFondo] = useState<'papel' | 'cuadros' | 'oscuro'>((q.get('fondo') as 'papel') || 'cuadros')
  const [reducido, setReducido] = useState(q.get('reducido') === '1')
  const [suelo, setSuelo] = useState(q.get('suelo') !== '0')
  const [transf, setTransf] = useState<EstiloArte>('pixel')
  const [pasos, setPasos] = useState<Record<string, string>>({})
  const [poofs, setPoofs] = useState(0)

  const clase = `ficha ${fondo === 'papel' ? '' : fondo}`
  const sueloPx = (ANCLA.y / LIENZO) * tam
  const sty = { ['--suelo' as string]: `${sueloPx}px` }
  const vieja = [['pluma', PLUMA], ['plumon', PLUMON], ['timbre', TIMBRE]] as const
  const nuevo = (estilo: EstiloArte, id = estilo) => (
    <div className={clase} key={id}>
      <div className="linea-suelo" style={sty}>
        <Personaje
          animal="gatito"
          estilo={estilo}
          animacion={anim}
          tam={tam}
          reducido={reducido || undefined}
          etiqueta={`gatito ${estilo}`}
          alPaso={({ paso }) => setPasos((p) => (p[id] === String(paso) ? p : { ...p, [id]: String(paso) }))}
        />
      </div>
      <small>{`${estilo} · ${anim} · paso ${pasos[id] ?? '–'}`}</small>
    </div>
  )

  return (
    <div className={suelo ? 'guia-suelo' : ''}>
      <h1>Gatito: sistema anterior vs. reproductor de hojas</h1>
      <p className="nota">
        Izquierda, el SVG+CSS actual (3 pieles, un solo trazado, 0 cuadros). Derecha, el reproductor nuevo.
        Los PNG de hoy son hojas GUÍA (plantilla técnica), no arte: cuadro, duración, suelo y ancla.
      </p>
      <div className="barra">
        <label>animación
          <select value={anim} onChange={(e) => setAnim(e.target.value as Anim)}>
            <option value="reposo">reposo</option><option value="caminar">caminar</option><option value="dormir">dormir</option>
          </select>
        </label>
        <label>tamaño
          <select value={tam} onChange={(e) => setTam(Number(e.target.value))}>
            {[64, 96, 128, 160, 192].map((t) => <option key={t} value={t}>{t}px</option>)}
          </select>
        </label>
        <label>fondo
          <select value={fondo} onChange={(e) => setFondo(e.target.value as 'papel')}>
            <option value="cuadros">transparencia</option><option value="papel">papel</option><option value="oscuro">oscuro</option>
          </select>
        </label>
        <label><input type="checkbox" checked={reducido} onChange={(e) => setReducido(e.target.checked)} />reducir movimiento</label>
        <label><input type="checkbox" checked={suelo} onChange={(e) => setSuelo(e.target.checked)} />línea de suelo</label>
      </div>

      <h2>Anterior · SVG + CSS (ánimo: {ANIMO[anim]})</h2>
      <div className="hilera viejo">
        {vieja.map(([n, piel]) => (
          <div className={clase} key={n}>
            <div className="linea-suelo" style={sty}>
              <div className="mono mono--gatito" data-animo={ANIMO[anim]} style={{ width: tam }}>
                {piel.gatito(ANIMO[anim])}
              </div>
            </div>
            <small>{n}</small>
          </div>
        ))}
      </div>

      <h2>Nuevo · hojas de sprites, un archivo de arte por estilo</h2>
      <div className="hilera">{nuevo('pixel')}{nuevo('caricatura')}</div>

      <h2>Nuevo · transformación poof (cambia de estilo con el personaje oculto)</h2>
      <div className="hilera">
        <div>
          <div className={clase}>
            <div className="linea-suelo" style={sty}>
              <Personaje
                animal="gatito"
                estilo={transf}
                animacion={anim}
                tam={tam}
                reducido={reducido || undefined}
                alListo={() => setPoofs((n) => n + 1)}
                alPaso={({ estilo, paso }) => setPasos((p) => (p.t === `${estilo}:${paso}` ? p : { ...p, t: `${estilo}:${paso}` }))}
              />
            </div>
            <small>{`estilo ${transf} · ${pasos.t ?? '–'} · listos ${poofs}`}</small>
          </div>
          <div className="barra" style={{ marginTop: 8 }}>
            <button data-id="poof" onClick={() => setTransf(transf === 'pixel' ? 'caricatura' : 'pixel')}>
              ¡poof! → {transf === 'pixel' ? 'caricatura' : 'pixel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('raiz')!).render(<Demo />)
