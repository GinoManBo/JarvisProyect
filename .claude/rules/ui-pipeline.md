# Protocolo de diseño y remake de interfaces

Cuando el usuario solicite crear una UI, rediseñar o replicar una existente:

- Delegar la coordinación en `ui-orchestrator`, preferiblemente iniciando la sesión con `claude --agent ui-orchestrator`.
- Detectar `REMAKE` (réplica fiel vs rediseño) o `DESDE_CERO`. No convertir una réplica fiel en un rediseño.
- Antes de codificar, establecer contrato UX, dirección visual y tokens; no imponer un template genérico.
- Respetar stack, arquitectura y marca existente. Evitar cambios destructivos, dependencias no justificadas y claims inventados.
- Para nuevos diseños, exigir alternativas con diferencias auténticas; para remakes fieles, prima la fidelidad a la referencia.
- Al terminar, ejecutar crítica independiente (Impeccable) y QA en navegador real (Playwright). Si no hay navegador, declarar validación pendiente.
- Evidencias y decisiones del pipeline en `.ui-pipeline/`; no confundir especificación con pruebas ejecutadas.
