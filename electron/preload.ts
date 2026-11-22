import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('jarvis', {
  leer: (col: string) => ipcRenderer.invoke('datos:leer', col),
  guardar: (col: string, data: unknown) => ipcRenderer.invoke('datos:guardar', col, data),
  exportar: () => ipcRenderer.invoke('datos:exportar'),
  respaldar: () => ipcRenderer.invoke('datos:respaldar'),
  abrirCarpeta: () => ipcRenderer.invoke('datos:carpeta'),
  avisar: (titulo: string, cuerpo: string) => ipcRenderer.invoke('avisar', titulo, cuerpo),
  avisos: {
    estado: () => ipcRenderer.invoke('avisos:estado'),
    sincronizar: (eventos: unknown[]) => ipcRenderer.invoke('avisos:sincronizar', eventos),
    enviar: (texto: string) => ipcRenderer.invoke('avisos:enviar', texto),
  },
  codigos: () => ipcRenderer.invoke('codigos:indice'),
  buscarArticulos: (slug: string, consulta: string) =>
    ipcRenderer.invoke('codigos:buscar', slug, consulta),
})
