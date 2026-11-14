# Prompt de arranque: rehacer los monitos

Modo: DESDE_CERO (reemplaza las pieles actuales).

## Qué son
Siete animalitos (gatito, perrito, conejito, ranita, caracol, cuy, appa) que pasean por la
pantalla del pomodoro (Descanso). Estados: `estudia` (foco), `recreo` (pausa), `siesta` (reloj parado).
Las pieles rotan cada 15 min con un destello. Hoy hay 6: tinta, pixel, acuarela, papel, neón, plastilina.

## Archivos
- `src/views/Monitos.tsx` — orquestador (paseo, volteo, vuelo de Appa, rotación, paisaje).
- `src/views/MonitosTinta.tsx`, `MonitosPixel.tsx`, `MonitosFigura.tsx` — dibujo de cada piel.
- `src/estilos.css` — sección "Descanso: los monitos" (~línea 1358) y "Pieles de superficie" (~1750).

## Restricciones (de CLAUDE.md)
- Identificadores en español. Sin dependencias nativas ni librerías pesadas: SVG + CSS puro.
- Colores y tipografía vía tokens de `estilos.css`; todo color nuevo va también en `:root[data-tema='oscuro']`.
- Estética: tinta sobre papel, margen rosa; los colores saturados solo cuando marcan algo.
- `aria-hidden`, y respetar `prefers-reduced-motion`.
- Verificación: `npm run build` es el portón. La UI se prueba con `npm run dev` (no hay captura posible en Linux/Wayland).

## Pedido
Pipeline completo: brief, 3 propuestas visuales realmente distintas, elegir una justificada,
sistema de diseño, implementación por lotes, crítica independiente. Conservar la interfaz
`PIELES[estilo][animal](animo)` o justificar el cambio.
