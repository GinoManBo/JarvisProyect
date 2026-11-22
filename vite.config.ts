import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

// `npm run red` (SOLO_WEB=1) sirve sólo el renderer, sin levantar Electron:
// para mirar la app desde otro aparato de la misma red. En el navegador los
// datos viven en el localStorage de ese navegador y el buscador de códigos no
// está — vive en el proceso main de Electron.
//
// La URL y la clave del servicio de avisos (`.env`, fuera de git) entran sólo al
// proceso main. Sin prefijo VITE_ a propósito: así nunca llegan al renderer.
// Vacías = el panel de Telegram queda apagado.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'AVISOS_')
  const definir = {
    __AVISOS_URL__: JSON.stringify(env.AVISOS_URL ?? ''),
    __AVISOS_CLAVE__: JSON.stringify(env.AVISOS_CLAVE ?? ''),
  }

  return {
    plugins: [
      react(),
      ...(process.env.SOLO_WEB
        ? []
        : [
            electron({
              main: { entry: 'electron/main.ts', vite: { define: definir } },
              preload: { input: 'electron/preload.ts' },
            }),
          ]),
    ],
  }
})
