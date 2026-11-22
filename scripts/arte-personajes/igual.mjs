import { leerPng } from './lib.mjs'
for (const a of ['conejito', 'cuy']) for (const n of ['reposo', 'caminar', 'dormir', 'colgar', 'caer', 'jugar', 'reaccion', 'poof']) {
  const x = leerPng(`/home/ginol/Escritorio/JarvisProyect/recursos/personajes/${a}/pixel/${n}.png`), y = leerPng(`sal/${a}/${n}.png`)
  let d = 0; if (x.w !== y.w) d = -1; else for (let i = 0; i < x.img.length; i += 4) { if (x.img[i + 3] !== y.img[i + 3] || (x.img[i + 3] && (x.img[i] !== y.img[i] || x.img[i + 1] !== y.img[i + 1] || x.img[i + 2] !== y.img[i + 2]))) d++ }
  if (d) console.log('DIFIERE', a, n, d)
}
console.log('comparado')
