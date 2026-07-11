/**
 * Baja los códigos desde LeyChile (BCN) y los deja como JSON en `recursos/codigos/`.
 *
 *   node scripts/codigos.mjs           # todos
 *   node scripts/codigos.mjs civil cpc # sólo esos
 *
 * Se corre a mano, no en cada build: el resultado se versiona junto al código.
 * La app nunca sale a la red — lee estos JSON desde el proceso main.
 *
 * El XML de LeyChile trae el PDF de la norma incrustado en base64 (el Código
 * Civil pesa 96 MB por eso), así que cortamos en <ArchivosBinarios> antes de
 * parsear. Los artículos son <EstructuraFuncional tipoParte="Artículo">, con el
 * número en <NombreParte> y el texto en <Texto>, colgando de los libros y
 * títulos que los agrupan.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = join(RAIZ, 'recursos', 'codigos')

// idNorma de LeyChile. Son los textos refundidos vigentes, no las versiones
// originales de 1855: el Código Civil vivo es el DFL 1 del año 2000.
//
// `delArticulo`: los refundidos no son el código, son un DFL que lo *fija* en uno
// de sus artículos y le cuelga leyes apéndice en los demás. El DFL 1 de 2000 trae
// el Código Civil en su ARTÍCULO 2 (2.565 arts.) y, en los artículos 3 al 8, la
// Ley de Registro Civil, la del nombre, la de menores, la de alimentos y la de
// herencias — todas con su propio "Artículo 1º". Sin este filtro el buscador
// devuelve siete artículos 1 distintos. Los códigos que son la norma entera
// (Penal, Comercio, Constitución…) no llevan esta marca.
const CODIGOS = [
  { slug: 'civil', sigla: 'CC', nombre: 'Código Civil', idNorma: 172986, delArticulo: 2 },
  { slug: 'penal', sigla: 'CP', nombre: 'Código Penal', idNorma: 1984 },
  { slug: 'procesal-penal', sigla: 'CPP', nombre: 'Código Procesal Penal', idNorma: 176595 },
  { slug: 'procedimiento-civil', sigla: 'CPC', nombre: 'Código de Procedimiento Civil', idNorma: 22740 },
  { slug: 'constitucion', sigla: 'CPR', nombre: 'Constitución Política', idNorma: 242302 },
  { slug: 'trabajo', sigla: 'CT', nombre: 'Código del Trabajo', idNorma: 207436 },
  { slug: 'comercio', sigla: 'CCom', nombre: 'Código de Comercio', idNorma: 1974 },
  { slug: 'organico-tribunales', sigla: 'COT', nombre: 'Código Orgánico de Tribunales', idNorma: 25563 },
  { slug: 'tributario', sigla: 'CTrib', nombre: 'Código Tributario', idNorma: 6374, delArticulo: 1 },
]

// LeyChile responde 401 sin un User-Agent de navegador.
const AGENTE =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const url = (idNorma) => `https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=${idNorma}`

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodificar(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ENTIDADES[e])
}

// Las notas del BCN al margen: "LEY N° 18.825", "D.O. 26.08.2005", "L. 6.162".
const NOTA = /(D\.\s?O\.|LEY\s*N|\bL\.\s*\d|CPR\s*Art|DTO\s*N|DECRETO|\b\d{2}\.\d{2}\.\d{4}\b)/i
// Restos sueltos de esas notas: "1°", "N° 3", "Art. único".
const SOBRA = /^(?:[\d.ºo°N\s-]+|Art\.?\s.*|N[°º].*)$/i

/**
 * LeyChile maqueta el articulado en dos columnas: la norma a la izquierda y las
 * notas de vigencia del BCN pegadas a la derecha. La columna no cae siempre en
 * el mismo lugar, así que las reconocemos por lo que dicen, no por dónde están.
 */
function despegarMargen(linea) {
  const l = linea.replace(/\s+$/, '')
  const inicio = l.search(/\S/)
  if (inicio === -1) return ''
  if (inicio >= 40) return '' // la línea entera cae en la columna del margen

  // Un salto de 3+ espacios separa la norma de la nota.
  const [texto, ...resto] = l.trim().split(/\s{3,}/)
  if (resto.length === 0) return texto
  // Sólo se descarta la cola si parece nota; si no, era texto con espacios de más.
  const cola = resto.filter((c) => !NOTA.test(c) && !SOBRA.test(c))
  return [texto, ...cola].join(' ')
}

/**
 * El texto trae los cortes de línea de la imprenta (~55 columnas). Se rearman
 * los párrafos: las líneas seguidas son un párrafo, la línea en blanco lo corta.
 * Si no, "legítima defensa" queda partida en dos y no se puede buscar.
 */
function limpiar(s) {
  const lineas = decodificar(s)
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => despegarMargen(l).trim())

  const parrafos = []
  let actual = []
  for (const l of lineas) {
    if (l) actual.push(l)
    else if (actual.length) {
      parrafos.push(actual.join(' '))
      actual = []
    }
  }
  if (actual.length) parrafos.push(actual.join(' '))

  return parrafos
    .join('\n\n')
    .replace(/ +/g, ' ')
    .replace(/ ([,.;:])/g, '$1')
    .trim()
}

/** "1 ", "45 bis", "1545 (DEL ART. 2)" -> { num: 1545, etiqueta: "1545" } */
function numeroDe(nombreParte) {
  const limpio = decodificar(nombreParte)
    .replace(/\s+/g, ' ')
    // Los refundidos numeran "1545 (DEL ART. 2)" por colgar del DFL que los fija.
    .replace(/\(\s*DEL\s+ART[IÍ]?[CÍ]?U?L?O?\.?[^)]*\)/gi, '')
    .trim()
  const m = limpio.match(/^(\d+)/)
  return { num: m ? Number(m[1]) : null, etiqueta: limpio }
}

function parsear(xml, delArticulo) {
  // Fuera el PDF en base64: sin esto el regex se arrastra por 90 MB de ruido.
  const corte = xml.indexOf('<ArchivosBinarios')
  const cuerpo = corte === -1 ? xml : xml.slice(0, corte)

  const titulo = /<TituloNorma>([\s\S]*?)<\/TituloNorma>/.exec(cuerpo)
  const partes =
    /<EstructuraFuncional\b([^>]*)>|<\/EstructuraFuncional>|<Texto>([\s\S]*?)<\/Texto>|<NombreParte[^>]*>([\s\S]*?)<\/NombreParte>|<TituloParte[^>]*>([\s\S]*?)<\/TituloParte>/g

  const pila = []
  const articulos = []

  for (let m; (m = partes.exec(cuerpo)); ) {
    const [todo, attrs, texto, nombre, tituloParte] = m

    if (attrs !== undefined) {
      const tipo = /tipoParte="([^"]*)"/.exec(attrs)
      const derogado = /derogado="([^"]*)"/.exec(attrs)
      const transitorio = /transitorio="([^"]*)"/.exec(attrs)
      // El padre deja de ser hoja: "ARTICULOS TRANSITORIOS" es un agrupador con
      // tipoParte="Artículo Transitorio", no un artículo.
      if (pila.length) pila[pila.length - 1].hijos = true
      pila.push({
        tipo: tipo ? decodificar(tipo[1]) : '',
        derogado: derogado ? derogado[1] !== 'no derogado' : false,
        transitorio: transitorio ? transitorio[1] !== 'no transitorio' : false,
        texto: '',
        nombre: '',
        titulo: '',
      })
      continue
    }

    const nodo = pila[pila.length - 1]
    if (!nodo) continue

    if (todo === '</EstructuraFuncional>') {
      pila.pop()
      if (!nodo.tipo.startsWith('Artículo') || nodo.derogado || nodo.hijos) continue

      // "1545 (DEL ART. 2)": el artículo del DFL del que cuelga. Si el código
      // vive en uno solo, lo de los demás es apéndice y no va.
      if (delArticulo) {
        const marca = /\(\s*DEL\s+ART\.?\s*(\d+)\s*\)/i.exec(nodo.nombre)
        if (!marca || Number(marca[1]) !== delArticulo) continue
      }

      const { num, etiqueta } = numeroDe(nodo.nombre)
      const cuerpoArt = limpiar(nodo.texto)
      if (!cuerpoArt) continue

      articulos.push({
        num,
        // Los transitorios reinician la numeración: sin decirlo, un "Art. 1" del
        // Código del Trabajo y el "Art. 1 transitorio" se ven idénticos.
        etiqueta: nodo.transitorio ? `${etiqueta} transitorio` : etiqueta,
        transitorio: nodo.transitorio,
        texto: cuerpoArt,
        // Los ancestros que siguen en la pila son el libro / título / párrafo.
        // Los textos refundidos cuelgan del "ARTÍCULO 2" del DFL que los fija;
        // ese ancestro es andamiaje, no ubicación dentro del código.
        ubicacion: pila
          .map((p) => p.titulo)
          .filter((t) => t && !/^ART[IÍ]CULO\s+\d/i.test(t))
          .join(' · '),
      })
      continue
    }

    if (texto !== undefined && !nodo.texto) nodo.texto = texto
    if (nombre !== undefined && !nodo.nombre) nodo.nombre = decodificar(nombre).trim()
    if (tituloParte !== undefined && !nodo.titulo) {
      const t = decodificar(tituloParte).replace(/\s+/g, ' ').trim()
      // TituloParte viene con presente="no" y un &#160; cuando no hay título.
      if (t && t !== ' ') nodo.titulo = t
    }
  }

  return {
    tituloNorma: titulo ? decodificar(titulo[1]).replace(/\s+/g, ' ').trim() : '',
    articulos,
  }
}

async function bajar(codigo) {
  const res = await fetch(url(codigo.idNorma), { headers: { 'User-Agent': AGENTE } })
  if (!res.ok) throw new Error(`${codigo.slug}: HTTP ${res.status}`)

  const { tituloNorma, articulos } = parsear(await res.text(), codigo.delArticulo)
  if (articulos.length === 0) throw new Error(`${codigo.slug}: no salió ningún artículo`)

  const salida = {
    slug: codigo.slug,
    sigla: codigo.sigla,
    nombre: codigo.nombre,
    idNorma: codigo.idNorma,
    tituloNorma,
    fuente: url(codigo.idNorma),
    bajado: new Date().toISOString().slice(0, 10),
    articulos,
  }

  await writeFile(join(SALIDA, `${codigo.slug}.json`), JSON.stringify(salida), 'utf8')
  console.log(
    `${codigo.sigla.padEnd(6)} ${String(articulos.length).padStart(5)} artículos  ${tituloNorma.slice(0, 60)}`,
  )
  return { slug: codigo.slug, sigla: codigo.sigla, nombre: codigo.nombre, articulos: articulos.length }
}

const pedidos = process.argv.slice(2)
const lista = pedidos.length ? CODIGOS.filter((c) => pedidos.includes(c.slug)) : CODIGOS

await mkdir(SALIDA, { recursive: true })

const indice = []
for (const c of lista) {
  try {
    indice.push(await bajar(c))
  } catch (e) {
    console.error(`✗ ${c.slug}: ${e.message}`)
  }
}

await writeFile(join(SALIDA, 'indice.json'), JSON.stringify(indice, null, 2), 'utf8')
console.log(`\n${indice.length} códigos en recursos/codigos/`)
