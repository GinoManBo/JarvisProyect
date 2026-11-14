# Pedidos de monitos pixel — quién dibuja qué y en qué modo

| Terminal | Modo | Animales | Cómo arrancar |
|---|---|---|---|
| 1 (sesión principal) | **LIVE** (tu ventana de Aseprite) | gatito → perrito | ya corriendo |
| 2 | **HEADLESS** | conejito → ranita → caracol | `cd ~/Escritorio/JarvisProyect && ASEPRITE_AI_HEADLESS=1 claude` y pegar: `Lee .ui-pipeline/pedidos/terminal-2.md y hazlo.` |
| 3 | **HEADLESS** | cuy → appa | `cd ~/Escritorio/JarvisProyect && ASEPRITE_AI_HEADLESS=1 claude` y pegar: `Lee .ui-pipeline/pedidos/terminal-3.md y hazlo.` |

`ASEPRITE_AI_HEADLESS=1` hace que el servidor de Aseprite de ESA terminal arranque sin ventana.
Así nunca se engancha a la ventana de la terminal 1. Si no encuentra el binario, agrega
`ASEPRITE_PATH=/home/ginol/.local/share/Steam/steamapps/common/Aseprite/aseprite` delante.

Reglas comunes: `base-comun.md`.
