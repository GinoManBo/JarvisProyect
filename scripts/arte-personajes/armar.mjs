import { tira, contacto } from './lib.mjs'
import { nube } from './nube.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
const animal = process.argv[2]
const { anim } = await import(animal === 'conejito' ? './conejito.mjs' : './cuy.mjs')
const poof = nube()
anim.poof = { dur: [60, 60, 60, 90, 90, 70, 70, 80], bucle: false, marcas: { cubre: 2, libera: 4 }, cuadros: poof }
const orden = ['reposo', 'caminar', 'dormir', 'colgar', 'caer', 'jugar', 'reaccion', 'poof']
mkdirSync('sal/' + animal, { recursive: true })
const todos = []; const etiquetas = []; const durs = []
const man = { version: 1, animal, estilo: 'pixel', render: 'pixelado', celdaPx: 64, animaciones: {} }
for (const n of orden) {
  const a = anim[n]; const k = a.cuadros.length
  if (a.dur.length !== k) throw new Error(n + ' duraciones')
  etiquetas.push({ name: n, from: todos.length + 1, to: todos.length + k })
  todos.push(...a.cuadros); durs.push(...a.dur)
  tira(`sal/${animal}/${n}.png`, a.cuadros)
  const e = { fuente: { tipo: 'hoja', archivo: n + '.png', columnas: k, cuadros: k }, duraciones: a.dur, bucle: a.bucle }
  if (a.fijo != null) e.fijo = a.fijo
  if (a.impacto != null) e.marcas = { impacto: a.impacto }
  if (a.marcas) e.marcas = a.marcas
  man.animaciones[n] = e
}
tira(`sal/${animal}/todo.png`, todos)
contacto(`sal/${animal}/ver.png`, todos, 8, 3)
// manifiesto con el mismo formato compacto que gatito
const lineas = Object.entries(man.animaciones).map(([n, e]) => {
  const f = e.fuente
  let s = `    "${n}": {\n      "fuente": { "tipo": "hoja", "archivo": "${f.archivo}", "columnas": ${f.columnas}, "cuadros": ${f.cuadros} },\n      "duraciones": [${e.duraciones.join(', ')}],\n      "bucle": ${e.bucle}`
  if (e.fijo != null) s += `,\n      "fijo": ${e.fijo}`
  if (e.marcas) s += `,\n      "marcas": { ${Object.entries(e.marcas).map(([k, v]) => `"${k}": ${v}`).join(', ')} }`
  return s + '\n    }'
})
writeFileSync(`sal/${animal}/manifiesto.json`, `{\n  "version": 1,\n  "animal": "${animal}",\n  "estilo": "pixel",\n  "render": "pixelado",\n  "celdaPx": 64,\n  "animaciones": {\n${lineas.join(',\n')}\n  }\n}\n`)
JSON.parse((await import('node:fs')).readFileSync(`sal/${animal}/manifiesto.json`, 'utf8'))
console.log(animal, 'cuadros', todos.length)
console.log('etiquetas', JSON.stringify(etiquetas))
console.log('duraciones', JSON.stringify(durs))
for (const n of ['caminar', 'jugar']) { const a = anim[n]; const t = a.dur.reduce((s, d) => s + d, 0); console.log(n, 'total', t, a.impacto != null ? 'impacto ms ' + a.dur.slice(0, a.impacto).reduce((s, d) => s + d, 0) : '') }
