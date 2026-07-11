import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const dir = () => path.join(app.getPath('userData'), 'datos')
const backupDir = () => path.join(dir(), 'respaldos')
const fileFor = (col: string) => path.join(dir(), `${col}.json`)

const COLLECTIONS = ['ramos', 'notas', 'citas', 'flashcards', 'eventos', 'ajustes', 'malla'] as const
export type Collection = (typeof COLLECTIONS)[number]

function isCollection(name: string): name is Collection {
  return (COLLECTIONS as readonly string[]).includes(name)
}

export async function readCollection(name: string): Promise<unknown> {
  if (!isCollection(name)) throw new Error(`Coleccion desconocida: ${name}`)
  try {
    const raw = await fs.readFile(fileFor(name), 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

// Write to a temp file first, then rename. A crash mid-write leaves the previous
// file intact instead of a truncated one.
export async function writeCollection(name: string, data: unknown): Promise<void> {
  if (!isCollection(name)) throw new Error(`Coleccion desconocida: ${name}`)
  await fs.mkdir(dir(), { recursive: true })
  const target = fileFor(name)
  const tmp = `${target}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, target)
}

export async function exportAll(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  for (const name of COLLECTIONS) out[name] = await readCollection(name)
  return out
}

export async function backupAll(): Promise<string> {
  await fs.mkdir(backupDir(), { recursive: true })
  const stamp = new Date().toISOString().slice(0, 10)
  const target = path.join(backupDir(), `jarvis-${stamp}.json`)
  await fs.writeFile(target, JSON.stringify(await exportAll(), null, 2), 'utf8')
  return target
}

export function dataDir(): string {
  return dir()
}
