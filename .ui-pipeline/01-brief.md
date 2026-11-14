# 01 — Brief: rehacer los monitos

**Modo:** DESDE_CERO (reemplaza las pieles actuales; no es réplica fiel).
**Fuente:** `.ui-pipeline/00-prompt-monitos.md` + inspección del código (2026-11-12).

## Objetivo
Rehacer el dibujo de los siete animalitos que pasean al pie de la pantalla Descanso
(pomodoro), para que tengan identidad propia de Jarvis y no se lean como stickers
genéricos. Conservar el orquestador (paseo, volteo, vuelo de Appa, rotación con destello,
paisaje) salvo que el diseño justifique cambiarlo.

## Audiencia y contexto
- Javiera, estudiante de Derecho (Chile). App personal, regalo. Se mira de reojo mientras
  estudia 25–90 min: los monitos son compañía periférica, no protagonistas.
- Plataforma: Electron en macOS (tipografía New York/SF solo allí). Ventana de escritorio
  ~1200–1440px. Se desarrolla en Linux; el renderer se verifica con Playwright contra vite.

## Estado actual (evidencia: `.ui-pipeline/capturas/base/*.png`)
- 7 animales: gatito, perrito, conejito, ranita, caracol, cuy, appa (vuela arriba).
- 3 ánimos: `estudia` (foco corriendo), `recreo` (pausa corriendo), `siesta` (reloj parado:
  quedan congelados, con zetas y tecito).
- 6 pieles que rotan cada 15 min con destello: tinta (MonitosTinta), pixel (MonitosPixel),
  acuarela/papel/neón/plastilina (geometría compartida MonitosFigura + CSS).
- Interfaz: `PIELES[estilo][animal](animo) => ReactNode` (svg).
- Cambios sin commitear del usuario en `Monitos.tsx` y `estilos.css`: paisaje (estrellas,
  nubes, árboles, río, pasto). **Son trabajo de Gino: conservarlos.**

Problemas observados en las capturas base:
1. Los animales son chicos (~50px) y se amontonan al centro del suelo, superpuestos
   (perrito/ranita/caracol/cuy pegados): se leen como una mancha.
2. Las pieles acuarela/papel/neón/plastilina se ven casi iguales a ojo (misma geometría
   chibi, solo cambia el filtro): la rotación promete variedad que no entrega.
3. Estética kawaii pastel genérica; poco vínculo con "tinta sobre papel / margen rosa".
4. En oscuro, rellenos pastel apagados con poco contraste de silueta.
5. Pixel convive raro con el resto (contorno negro duro sobre papel suave).

## Restricciones (no negociables)
- Identificadores y comentarios en español.
- Sin dependencias: SVG + CSS puro. Nada nativo.
- Color y tipo vía tokens de `src/estilos.css`; todo color nuevo también en
  `:root[data-tema='oscuro']`. Saturados solo cuando marcan algo.
- `aria-hidden="true"` en toda la capa decorativa; respetar `prefers-reduced-motion`
  (sin paseo/volteo/aleteo, posiciones quietas legibles).
- No tapar el reloj, los mandos ni el panel; `pointer-events: none`.
- Portón: `npm run build`. Evidencia visual: Playwright headless contra vite :5199.

## Supuestos (no dados por el usuario)
- S1: la rotación de pieles cada 15 min se mantiene como mecanismo (el pedido habla de
  "pieles"); la cantidad de pieles puede cambiar si el diseño lo justifica.
- S2: el paisaje nuevo de Gino (cielo, árboles, río, pasto) se queda; los monitos deben
  convivir con él.
- S3: Appa se mantiene volando arriba.
- S4: no hay referencia externa de marca; la referencia es el propio sistema de Jarvis.

## Riesgos
- Que "3 propuestas" terminen siendo la misma figura con 3 filtros (justo el defecto actual).
- Exceso de animación distrae del estudio.
- Rendimiento: 7 svgs animados + paisaje en ventana siempre abierta.
- La tipografía de las capturas Linux no es la de macOS (aclarar en QA).

## Criterios verificables de salida
1. `npm run build` pasa.
2. Captura de cada piel × 3 ánimos × claro/oscuro sin errores de consola.
3. Cada animal reconocible en silueta a 1:1 (sin depender del color).
4. Ánimos distinguibles en captura (estudia vs recreo vs siesta).
5. Pieles distinguibles entre sí a simple vista en miniatura.
6. Ningún monito tapa reloj/mandos/tiempos a 1440×900 ni 1180×800.
7. Con `reducedMotion: 'reduce'` no hay movimiento continuo.
8. Interfaz `PIELES[estilo][animal](animo)` conservada o cambio justificado en 03/04.

## Anexo: discovery (ui-product-discovery, 2026-11-12)
Mapeo capturas: piel0=acuarela, piel1=pixel, piel2=papel, piel3=plastilina, piel4=neón, piel5=tinta.

Hallazgos con evidencia:
- Cúmulo de ~120px (perrito/ranita/caracol/cuy) sobre ~1170px de suelo; conejito tapa al cuy.
- Tamaño ~40–60px; rasgos ilegibles; pixel en oscuro se rompe en teselas.
- acuarela/papel/plastilina/neón: misma geometría, en miniatura indistinguibles. Solo tinta conecta con la marca.
- Neón satura en oscuro (rompe "saturados solo cuando marcan algo").
- Destello de rotación puede caer en pleno foco.

Requisitos añadidos:
- MUST: sin solapamientos en reposo (bounding boxes) a 1440×900 y 1180×800; contraste de silueta ≥3:1 claro/oscuro; reduced-motion con poses quietas por ánimo.
- SHOULD: menos pieles pero claramente distintas; foco quieto, recreo vivo; tamaño ~72–96px repartidos a lo ancho; animar solo transform/opacity; destello solo fuera de foco.
- COULD: Appa esquiva "¿En qué estás?" y el reloj.

Preguntas abiertas → resueltas como supuestos (confirmar con Gino en la entrega):
- S1 se mantiene: rotación sí; se permite bajar el número de pieles si eso las hace distinguibles.
- S2 se mantiene: paisaje de Gino no se toca (solo se ajusta si tapa monitos, y se informa).
- S5: los siete se quedan; cada uno con su territorio en el suelo.
- S6: en foco, presencia mínima; la vida va en la pausa.
