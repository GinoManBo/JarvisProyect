import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

// `npm run red` (SOLO_WEB=1) sirve sólo el renderer, sin levantar Electron:
// para mirar la app desde otro aparato de la misma red. En el navegador los
// datos viven en el localStorage de ese navegador y el buscador de códigos no
// está — vive en el proceso main de Electron.
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.SOLO_WEB
      ? []
      : [
          electron({
            main: { entry: 'electron/main.ts' },
            preload: { input: 'electron/preload.ts' },
          }),
        ]),
  ],
})
