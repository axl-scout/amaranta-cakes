# Aprendizajes para el audit report

Reglas que Axel fijó en la auditoría del Prompt 2. Leer antes de hacer cualquier audit report de Canvas.

## Formato del mensaje en el chat
- Español neutro, empezar con "Axel,".
- Veredicto primero: una línea con PASS, PARTIAL o FAIL y la salvedad más importante. Sin conteos al inicio.
- "1. Pending items": todo lo que necesita decisión o acción de Axel, numerado, sin duplicados. Cada uno con tres líneas: Key message (con recomendación), Argument, Supporting data. Toda pregunta va aquí y en ningún otro lado.
- "2. Audit report": solo hallazgos, sin acciones. Viñetas OK / PARTIAL / FAIL con archivo y línea (Scope, Export, Schema, Regresión, contratos). Luego los ítems PASS / PARTIAL / FAIL y "Observaciones que no bloquean".
- "3. Smoke test": tabla # | Record | Expected.
- Prompt de corrección: completo, en español, en bloque de código, solo con lo que falta. En "No tocar" una sola línea: [PEGAR AQUÍ: No tocar y contratos C1-C3].
- Al final: "Tell me:" con los pendientes que debe responder y "Iteration log entry:" (Iteration | Step | Status | Verification result). No preguntar dónde va el log.
- No mezclar hallazgos con decisiones, no repetir una decisión en varios lugares, no mandar a un archivo lo que Axel debe pegar.
- Mensajes cortos: sin exceso de detalle. Si Axel pide menos, recortar.

## Prompt de corrección
- No enviarlo hasta que terminen todos los sets de pruebas (ahorra tokens).
- Textos de UI entre comillas en español, como la app.
- "¿Completar tarea?" debe ser un mini pop-up anclado a la etapa, no un modal a media pantalla: pregunta, "Sí" y "No", un texto corto que explique que "No" solo crea la tarea sin completarla, sin foco automático en "Sí" y cerrable con clic afuera.

## Smoke tests
- Archivo `.md` en español en `pedidos/dev/sessions/<fecha>-<tema>/`, un número por prueba y agrupadas por record.
- Cada prueba dice la ruta exacta: página (Pedidos, Producción), pop-up del pedido, detalle del elemento, vista del selector. Verificar los nombres reales en el código (la vista semanal de Producción se llama "Todos", no "Semana").
- Verificar el expected contra los datos reales completos del record antes de escribirlo (ejemplo: Ale tiene 2 tareas el 2 oct, no 1).
- Expected claro pero no excesivo, viñetas sin número al inicio.
- Quitar las pruebas que las capturas de Axel ya resuelven.
- Al cerrar un set, moverlo al final del archivo, en "Sets cerrados".
- Las pruebas que escriben en Producción corren solo en el record designado ([3413] Rosaura Avila) y llevan limpieza al final.

## Repo
- Todo se sube a `main`. Nunca a ramas, ni con PR.

## Auditoría
- Pedir a Axel la línea base del Prompt 1 (export) y el texto de C1-C3 y "No tocar" antes de auditar regresión y contratos.
- Si un criterio queda reemplazado por un mensaje posterior de Axel, auditar contra el mensaje y avisarlo.

## Decisiones vigentes del Prompt 2
- El detalle del pedido conserva la tabla de tareas con columna "Elemento" (mensaje de las 6:25 PM).
- Una etapa con tarea "Terminado" se ve completa, y las anteriores también, solo en pantalla.
- Se corrige el refresco del detalle del pedido tras cambios en el elemento.
- Falla a mitad de la secuencia "Sí": se acepta el resultado parcial con aviso que diga qué etapas se guardaron.
- Entran al prompt de corrección los defectos Esc, eliminar elemento con detalle abierto, orden de Embetunado y fechas con entrega pasada. "Reintentar tareas" queda como nota.
