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
- Tabla "Tareas de producción" del formulario de nuevo elemento: quitar las columnas Título, Cant. y Estatus (siguen prellenadas, solo no se muestran) y mostrar la etapa como chip con su color. Va al prompt de corrección.
- Selector de fechas de la tabla del formulario de nuevo elemento: un solo calendario para Inicio y Fin. Se edita primero Inicio y se abre el calendario; al elegir la fecha de inicio el calendario no se cierra y la siguiente selección es la de fin; ambas se muestran como periodo resaltado. Va al prompt de corrección.
- El selector de rango (Inicio y Fin en un solo calendario) aplica también al formulario de la tarea ("Fecha de inicio" y "Fecha de fin"), no solo a la tabla del formulario de nuevo elemento.
- Selectores de fecha: agregar un botón para limpiar la fecha elegida (mismo patrón de la "X" que reemplaza el caret en los filtros).
- Dropdowns (selector de Empleado en la tabla del formulario y los demás de la app): navegación con teclado, flecha arriba/abajo, Enter para elegir y Escape para cerrar, como el buscador de pedidos. Va al prompt de corrección.
- "¿Completar tarea?" (mini pop-up): quitar el texto explicativo; solo la pregunta y los botones "Sí" y "No".
- Detalle del elemento: reemplazar el botón "Editar" y su modal por edición en línea: los campos del detalle (nombre del producto, cantidad, descripción, etc.) son editables directamente y se guardan solos. El borrado del elemento queda como icono de basura con confirmación. Va al prompt de corrección.
- Aviso de entrega de producción pasada: texto más corto. Texto: "No se puede editar: la entrega de producción ya pasó."
- Cada prueba de los smoke tests empieza con la ruta completa: Página > pop-up o detalle > sección (por ejemplo "Página Pedidos > abre [3413] > fila Pastel 50 pax (detalle del elemento) > ..."). Nunca "en esa tabla" o "en Agregar elemento" sin decir dónde.
- El borrado del elemento, al quitar el modal "Editar", queda como icono de basura con confirmación en el encabezado del detalle.
- Fechas secuenciales entre etapas de un mismo elemento (tabla de "Agregar Elemento"): cada etapa posterior solo puede elegir inicio igual o posterior al fin de la etapa anterior (o a su inicio si no tiene fin). Ejemplo: Horneado del 5 al 7 oct, Embetunado solo desde el 7 oct. Si se mueve una etapa anterior más allá de las siguientes, las fechas posteriores se ajustan automáticamente. Aplica a la tabla de "Agregar Elemento" y al formulario de la tarea; las fechas posteriores se ajustan solas. Va al prompt de corrección.
- No se ejecutan pruebas de tema claro/oscuro. Se quita "modo claro y oscuro" de los criterios de aceptación de las pruebas manuales (queda en "No tocar").
- Fechas secuenciales: aplica a la tabla de "Agregar Elemento" y al formulario de la tarea (decidido por Axel); las fechas posteriores se ajustan solas, no se limpian.
- Respuesta inmediata en "Sí" y "No" del globo: la pantalla se actualiza al instante (actualización optimista) y, si la escritura falla, vuelve al estado real con el aviso de etapas guardadas.
- Quitar el texto explicativo del globo "¿Completar tarea?" (confirmado otra vez al probar con Cupcakes).
- Sección "Producción" del detalle del pedido: una tabla por elemento, con un subtítulo arriba de cada tabla con el nombre del elemento (en lugar de una sola tabla con todas las filas y la columna "Elemento"). Va al prompt de corrección.
- Al recibir un export nuevo, comparar siempre contra la versión anterior los archivos que la plataforma puede pisar: lib/airtable-hooks.tsx (la v1.8.0 perdió la actualización automática cada 30 s de la v1.4.0) y package.json (la v1.8.0 perdió dependencias). Avisar de cualquier regresión antes de dar por buena la versión.
- Detalle del elemento: quitar el campo "Nombre" (repite al Producto) y mostrar primero "Pedido" y luego "Producto".
- Tareas editables desde las tablas (detalle del pedido y detalle del elemento): solo "Empleado", "Inicio" y "Fin", directamente en la celda y con guardado automático; con las mismas reglas de fechas (rango, secuenciales, entrega pasada). Clic en las demás celdas sigue abriendo el formulario de la tarea (Avance, Estatus, Notas, Dividir).
- Detalle del pedido, tablas por elemento: los subtítulos van en el mismo orden que la tabla Elementos del pedido.

- Desplegables dentro de tablas y pop-ups (p. ej. Empleado en la última fila del detalle del elemento): no deben cortarse al fondo de la ventana; abren hacia arriba o se desplazan para verse completos. Va al prompt de corrección v1.8.2.
- Eliminar un elemento debe eliminar también sus tareas de producción (decidido por Axel tras la prueba 49: hoy quedan huérfanas). Va al prompt de corrección v1.8.3.
- Antes de pegar un prompt en Canvas, reemplazar el marcador [PEGAR AQUÍ: No tocar y contratos C1-C3] con el texto de contracts-and-no-tocar.md; en la v1.8.2 se pegó sin reemplazar.
