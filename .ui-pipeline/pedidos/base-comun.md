# Base común para dibujar un monito pixel (HEADLESS)

## Modo — no negociable
- Esta terminal trabaja **solo en HEADLESS**. Primer llamado: `preflight` con `mode="headless"`.
  Si devuelve modo live, o habla de una ventana adjunta: DETENTE y avisa. **Nunca** `mode="live"`:
  la ventana de Aseprite la está usando otra sesión.
- No toques `recursos/personajes/gatito/`, `src/`, `electron/` ni `scripts/`. El código y la
  conexión a la app los hace la sesión principal.
- En headless nada llega a disco hasta `sprite_manage save_as` / `export`: guarda siempre.

## Flujo por animal (skill `aseprite:studio`, sin preguntar: el brief ya está decidido)
1. Lee `recursos/personajes/ESPECIFICACION.md` y `recursos/personajes/gatito/pixel/manifiesto.json`.
   Mira como referencia de estilo `recursos/personajes/gatito/pixel/reposo.png` (si ya tiene el gato
   real, no la hoja GUÍA): mismo grosor de contorno, mismo nivel de detalle, misma ternura.
2. Reglas: `rules://30-proportions-by-size`, `rules://36-character-design`, `rules://32-heads-and-faces`,
   `rules://53-small-creatures`, `rules://40-timing-and-spacing`, `rules://41-idle-and-breathing`,
   `rules://42-walk-and-run`, `rules://92-generated-art-tells` + las que diga el animal.
3. **Cuadro clave** (reposo 0) en documento nuevo 64×64 RGBA → `look` → corrige.
4. **Crítica**: agente `aseprite:pixel-critic` (dale el brief del animal, nada de cómo se hizo, y dile: "preflight SIN mode o con mode=headless, nunca live").
   Sigue si 7/10+ sin BLOCKING; si no, una corrección puntual por ronda, máximo 3 rondas.
5. **Animaciones** como tags `reposo`(6), `dormir`(4), `caminar`(8), `poof`(8), duraciones del
   manifiesto del gatito. Duplica y modifica, no redibujes de cero.
6. **Exporta** sin padding, orden de lectura, a `recursos/personajes/<animal>/pixel/`:
   `reposo.png` 192×128 · `dormir.png` 256×64 · `caminar.png` 256×128 · `poof.png` 256×128.
   Copia `recursos/personajes/gatito/pixel/manifiesto.json` ahí cambiando solo `"animal"`.
   Guarda el fuente como `recursos/personajes/<animal>/pixel/<animal>.aseprite`.
7. `validate` en Aseprite. Comprueba dimensiones con `file`.
8. Reporte breve: paleta, archivos, nota del crítico, lo más débil.

## Reglas de arte (iguales a las del gatito)
- Celda 64×64, sin antialias, sin dithering, sin degradados, contorno 1 px, luz arriba-izquierda.
- Apoyo en **y = 60** en reposo/dormir/caminar; caja segura x 12–52, y 14–60; nada toca el borde
  (poof hasta 3 px del borde). Mira a **+x**. Fondo transparente, sin sombra de suelo.
- **Tierno**: cabeza grande (~45 % de la altura), ojos grandes de tinta con brillo de 1 px, rubor
  rosa, cara frontal chibi sobre cuerpo de perfil (convención aceptada en el gatito).
- **Paleta ≤ 8**. Comunes a todos: tinta `#2b3a8c` (contorno, ojos), blanco `#fffaf0`, sombra fría
  `#d9d6ea`, rosa `#f6c2d6`. Más 3–4 colores propios del animal (luz / medio / sombra con hue-shift).
- `poof`: la misma nube del gatito (blanco + lavanda + tinta, estrellitas del color propio); en el
  cuadro 2 tapa por completo al animal.
