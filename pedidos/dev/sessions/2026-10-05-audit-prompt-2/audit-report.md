# Audit report — Prompt 2/4 (detalle del elemento y tareas)

Informe inicial sobre el export v1.5.0 y cierre al final del documento.

```
Axel,

AUDITORIA PROMPT 2/4 - DETALLE DEL ELEMENTO Y COMPONENTE DE TAREAS
Export auditado: v1.5.0 (2026-10-05). Base: Produccion (appSQk87nF0WpH2gi). Solo lectura: no se cambio codigo ni se escribio en Airtable.

VEREDICTO
PARTIAL. El codigo cumple los 27 items salvo 2 parciales, pero la regresion y los contratos C1-C3 no se pudieron verificar porque falta la linea base del Prompt 1 y el texto de los contratos.


1. PENDING ITEMS

1. Adjuntar la linea base del Prompt 1 y el texto de los contratos C1-C3 y de la lista "No tocar".
Key message: Adjunta el export verificado del Prompt 1 (ZIP) y el texto completo de C1-C3 y "No tocar"; sin eso el diff y la auditoria de contratos siguen abiertos.
Argument: Ninguno de los tres archivos adjuntos los contiene, asi que revise la regresion solo contra el "Out of scope" del Prompt 2 y el comportamiento del Prompt 1, con confianza limitada.
Supporting data: 0 coincidencias de "No tocar" y "C1".."C3" en transcript y README; el repo tiene 1 solo commit que toca pedidos/ (3663d15, la v1.5.0) y pedidos/source es identico al ZIP (diff -rq sin diferencias).

2. Confirmar que el criterio "el detalle del pedido ya no muestra la tabla de tareas" queda reemplazado por tu mensaje de las 6:25 PM.
Key message: Confirma el reemplazo; recomiendo darlo por reemplazado porque Canvas siguio ese mensaje.
Argument: Segun el texto original del criterio la tabla seria un FAIL; segun tu mensaje (tabla con columna "Elemento" y linea de la etapa del elemento mas atrasado) es un PASS.
Supporting data: PedidoTareasSection.tsx:20,44,73 (tabla con columna Elemento) y PedidoDetailModal.tsx:373.

3. Decidir si una etapa con tarea "Terminado" y etapas previas inexistentes debe verse completa.
Key message: Decide si se muestra completa; recomiendo que no se cambie ahora y se trate como dato historico.
Argument: El tracker solo marca una etapa como hecha si todas las anteriores lo estan, asi que en pedidos viejos con solo la tarea de Empacado terminada se ve Horneado como actual y Empacado como pendiente. Hacer clic en "Si" sobre Empacado corrige el dato (crea las 3 etapas faltantes completas).
Supporting data: [4148] Blanca Valdes (recVNjMyWhvzgnU5t, elemento reci9DOqt8jfWadNx): tarea Empacado 100/100 Terminado, sin otras etapas; [4157] No se igual (30/30); StageTracker.tsx:15-23.

4. Decidir los 2 items PARTIAL.
Key message: Recomiendo corregir el primero y aceptar el segundo con un aviso que diga que etapas si se guardaron.
Argument: (a) El detalle del pedido que queda debajo no se actualiza cuando completas etapas o creas un elemento desde el detalle del elemento: hasta que lo cierras y lo vuelves a abrir muestra datos viejos, lo que incumple "refresca sin recargar". (b) Si una escritura falla a mitad de la secuencia "Si", las etapas anteriores ya quedaron guardadas; un rollback implicaria borrar tareas, por eso recomiendo aceptar el resultado parcial con aviso claro.
Supporting data: (a) PedidoTareasSection.tsx:66 usa su propia carga de datos, PedidoDetailModal.tsx:373 no le pasa disparador de refresco, airtable-hooks.tsx:766 pausa el auto-refresco mientras hay una ventana abierta. (b) PedidoTareasSection.tsx:129-157, escrituras una por una y un solo aviso generico en :155.

5. Decidir si los 5 defectos fuera de criterios entran al prompt de correccion o quedan como notas.
Key message: Recomiendo incluir los 4 primeros en el prompt de correccion y dejar el quinto como nota.
Argument: Los 4 primeros afectan al usuario (cierre de ventanas, ventana atorada, orden de etapas, fechas bloqueadas) y son baratos de corregir; el quinto es un caso raro de reintento.
Supporting data: ver "Observaciones que no bloquean" en la seccion 2. Si aceptas, te pego el prompt ampliado en el siguiente mensaje.


2. AUDIT OF PROMPT 2

Alcance, export, schema, regresion y contratos
- OK  Scope: las escrituras son solo a Tareas de produccion y a la creacion de Elementos, y las tareas nuevas llevan Origen = Manual (PedidoTareasSection.tsx:134-147, ElementoModals.tsx:128-143).
- OK  Scope: capacidad oculta sin borrar codigo ni datos (ProduccionPage.tsx:250, DayView.tsx:64 LoadBar sin uso, ProduccionPage.tsx:157 loadPct sin uso).
- OK  Export: pedidos/source es identico al ZIP adjunto; README y lib/changelog.ts en 1.5.0.
- PARTIAL  Export: lib/downloads.ts:1 importa ./sourceBundle y ese archivo no viene en el export, asi que no se puede confirmar que la copia descargable este al dia.
- OK  Schema: las 6 tablas leidas (pedidos, elementos, catalogo, tareas_produccion, capacidad_produccion, empleados) tienen todos los campos que usa el Prompt 2; son 11 tablas en la base y ninguna nueva.
- OK  Schema: no hay registros nuevos de Canvas: Tareas tiene 14 registros, el ultimo creado el 2026-10-03 04:46 UTC, antes del build (2026-10-05 00:36 UTC).
- PARTIAL  Regresion: sin violaciones por lectura de codigo contra el "Out of scope" (sin semaforo, sin vista Todos, sin selector de periodo, cake toppers sin tocar, riesgo sin cambios en ProduccionPage.tsx:106), pero sin diff contra la linea base.
- PARTIAL  Contratos C1-C3 y "No tocar": no verificables por nombre, no estan en los adjuntos.

Los 27 items
- PASS  Clic en la fila de un elemento abre su detalle (PedidoDetailModal.tsx:347, :411-415).
- PASS  Mismo patron de presentacion que el detalle del pedido (ElementoDetalle.tsx:27-28 vs PedidoDetailModal.tsx:219-221).
- PASS  El detalle muestra nombre, descripcion, producto, cantidad y pedido (ElementoDetalle.tsx:42-46).
- PASS  "Editar" abre el modal de edicion existente (ElementoDetalle.tsx:33, PedidoDetailModal.tsx:414,416-421).
- PASS  El componente de tareas pasa a nivel elemento, filtrado por Elemento (PedidoTareasSection.tsx:108-170).
- PASS  Tracker y avance por elemento con las etapas de su tipo de producto (PedidoTareasSection.tsx:19,165; useProduccionData.ts:168-179).
- PASS  Detalle del pedido: linea con la etapa del elemento mas atrasado y tabla con columna "Elemento" segun tu mensaje (PedidoTareasSection.tsx:76-100,20,44).
- PASS  El clic en una etapa pregunta "¿Completar tarea?" con Si / No y reemplaza el "+" (PedidoTareasSection.tsx:165,176-190).
- PASS  "Si" crea o completa con Estatus = Terminado y cantidad completada = asignada (PedidoTareasSection.tsx:129-152).
- PASS  Regla de secuencia: se completan o crean completas las etapas anteriores (PedidoTareasSection.tsx:131-152).
- PASS  "No" crea solo la tarea faltante, sin empleado y sin completar; no toca la existente (PedidoTareasSection.tsx:131-147).
- PASS  Etapa completa se muestra completa y sin deshacer (StageTracker.tsx:29-30).
- PASS  Empleado opcional, mostrado como "Sin asignar" (TaskModal.tsx:268, PedidoTareasSection.tsx:44).
- PASS  Fecha de inicio: no previa a la creacion ni posterior a la entrega de produccion (TaskModal.tsx:103-105,131-137,193).
- PASS  Fecha de fin: no previa al inicio ni posterior a la entrega (TaskModal.tsx:138-144,194).
- PASS  Fechas incongruentes se ajustan y los dias fuera de rango se deshabilitan (TaskModal.tsx:131-144, DateField.tsx:28, Calendar.tsx:95).
- PASS  Buscador por empleado en Produccion, en vista semana y dia (ProduccionPage.tsx:171-175,244,267).
- PASS  Formulario de nuevo elemento: seccion "Tareas de produccion" con 4 filas segun tipo; no aparece sin producto o con producto sin etapas (ElementoModals.tsx:80-81,212-239).
- PASS  Columnas editables Empleado, Inicio y Fin; el resto prellenado y no editable; titulo con el formato existente "[pedido_id] · Etapa · cantidad", verificado contra Tareas reales (ElementoModals.tsx:99,228-236).
- PASS  Reglas de fecha en la creacion: minimo hoy, maximo entrega de produccion, vacias validas (ElementoModals.tsx:84-98).
- PASS  Cambiar de producto regenera la tabla y conserva empleado y fechas de etapas coincidentes (ElementoModals.tsx:53,86).
- PASS  Guardar crea primero el elemento y luego las tareas, con aviso en espanol si fallan y sin duplicar al guardar dos veces (ElementoModals.tsx:118-147).
- PASS  Al editar un elemento existente no se muestra la tabla (ElementoModals.tsx:80, EditElementoModal sin bloque de tareas).
- PASS  Calculo de capacidad oculto en toda la app; indicador de riesgo sin cambios (ProduccionPage.tsx:250,106).
- PASS  Las escrituras son solo sobre Tareas y la creacion de Elementos, con Origen = Manual.
- PARTIAL  Al completar etapas se refresca el componente sin recargar: el detalle del elemento si, el detalle del pedido que esta debajo no (PedidoTareasSection.tsx:157, PedidoDetailModal.tsx:373, airtable-hooks.tsx:766).
- PARTIAL  Si una escritura falla: aviso en espanol y tracker como estaba: hay aviso pero generico y sin rollback, y las etapas previas quedan guardadas (PedidoTareasSection.tsx:129-157).

Los 10 criterios de aceptacion estan en PASS por lectura de codigo (el del detalle del pedido, segun tu mensaje); falta confirmarlos en pantalla con los smoke tests.

Observaciones que no bloquean
Defectos fuera de criterios:
1. Un solo Esc cierra a la vez el modal "Editar" y el detalle del elemento (ElementoDetalle.tsx:17 cuenta role=dialog y EditElementoModal no lo tiene).
2. Eliminar un elemento desde "Editar" deja el detalle abierto como esqueleto permanente (PedidoDetailModal.tsx:88,416-421).
3. En la tabla del detalle del pedido, Embetunado se ordena antes de Horneado (PedidoTareasSection.tsx:73 usa la lista fija de galletas).
4. Con la entrega de produccion ya pasada, todos los dias quedan deshabilitados y el error dice "anterior a hoy" (TaskModal.tsx:103-105,193; caso real [4128] Sara, entrega 1 oct, hoy 5 oct).
5. "Reintentar tareas" usa los valores actuales del formulario y no los del elemento ya guardado (ElementoModals.tsx:124-143).
Otras observaciones:
- El formulario de tarea sigue diciendo "Galletas asignadas" para tareas de pastel y cupcakes (TaskModal.tsx:191,304).
- Las tareas creadas desde el tracker no llevan fechas, por lo que no aparecen en el tablero de Produccion y su ritmo dice "Sin fecha".
- El filtro de etapas de Produccion y "Asignar tarea" siguen con la lista de galletas, sin Embetunado (ProduccionPage.tsx:239, TaskModal.tsx:36); es alcance de los Prompts 3 y 4.
Schema:
- El orden de las opciones de Etapa en Tareas es Horneado, Glaseado, Embetunado, Decorado, Empacado; el Prompt 1 pedia Embetunado antes de Glaseado. La app no depende de ese orden.
- La descripcion del campo etapa de Tareas sigue diciendo "Horneado → Glaseado → Decorado → Empaque".


3. SMOKE TEST

Ninguna prueba se ha ejecutado. Hoy es lunes 2026-10-05. Las pruebas de lectura solo abren pantallas; cierra los modales haciendo clic en el area oscura sin editar campos. Solo las pruebas 24 a 28 escriben datos en Produccion y corren unicamente sobre [3413] Rosaura Avila (rec3OES0NemnxyyzY).

Record A: [4128] Sara (recZCPIvYm7J76UX1), elemento Galletas x10 (rechrqhXxQTNufJjL). Pendiente, entrega de produccion 1 oct, entrega al cliente 7 oct. Tareas: Horneado (Ale, 2 oct), Glaseado (Lalo, 5 oct), Decorado (Lalo, 5 oct), Empacado (sin empleado, 2 oct); todas 0/10 Pendiente.
Este record es el que vas a utilizar para las pruebas 1 a 9. Fecha para abrir: calendario de Pedidos el 1 oct 2026; Produccion semana 28 sep-4 oct y semana 5-11 oct.
1. Detalle del elemento. Pedidos, abrir la orden, clic en la fila "Galletas". Esperado: se abre sobre la orden con el mismo aspecto; titulo "Galletas", Cantidad 10, Pedido [4128] Sara, descripcion o "—", botones "Editar" y cerrar.
2. Tracker. Misma pantalla. Esperado: Horneado como actual, Glaseado, Decorado y Empacado pendientes en gris, ninguna marcada.
3. Tabla de tareas del elemento. Esperado: 4 filas en orden Horneado, Glaseado, Decorado, Empacado; sin columna "Elemento"; empleados Ale, Lalo, Lalo, "Sin asignar"; inicio vie 2 oct, lun 5 oct, lun 5 oct, vie 2 oct; avance 0/10.
4. Tabla de tareas del pedido. Cerrar el detalle del elemento y ver "Produccion" en el detalle del pedido. Esperado: linea "Etapa actual del elemento mas atrasado: Horneado · Galletas"; tabla con columna "Elemento" = Galletas en 4 filas; sin tracker y sin boton "+".
5. Formulario de tarea. Clic en la fila Empacado. Esperado: abre el formulario, Empleado muestra "Sin asignar" y no se escribe nada si no cambias un campo.
6. Reglas de fecha (caso limite). Abrir los selectores de inicio y fin de la tarea Horneado sin elegir. Esperado: todos los dias deshabilitados (minimo 2 oct por creacion, maximo 1 oct por entrega).
7. Clic en etapa, ruta de cancelar. Clic en el circulo Glaseado. Esperado: aparece "¿Completar tarea?" con "Etapa: Glaseado", "No" y "Si"; clic en el area oscura la cierra y Airtable sigue con 4 tareas Pendiente; Esc no hace nada.
8. Buscador por empleado, semana. Produccion, semana 5-11 oct, escribir "Lalo". Esperado: solo las tareas de Lalo ([4128] Sara Glas. 0/10 y Deco. 0/10 el lun 5); al borrar el texto vuelven todas.
9. Buscador por empleado, vista dia. Produccion, vista Dia, vie 2 oct, escribir "Ale". Esperado: solo Ale (Horneado [4128] Sara); no hay porcentaje de carga ni boton "Capacidades" en la pagina.

Record B: [4160] Alice (rec2FnINtW50a2LFW), elemento Galletas x50 (recBX90Il48rAJp2h). Entregado; 4 tareas Terminado (Horneado Ale, Glaseado Fatima, Decorado Lalo, Empacado Rach, todas 2 oct). Si el filtro de estatus la oculta, usa el buscador de pedidos con "4160".
Este record es el que vas a utilizar para las pruebas 10 a 12. Fecha para abrir: entrega de produccion 30 sep 2026; Produccion semana 28 sep-4 oct.
10. Elemento completo. Abrir la orden y clic en "Galletas". Esperado: 4 marcas, ninguna etapa clicable; tabla de 4 filas con avance 50/50 y ritmo "Terminada".
11. Detalle del pedido. Cerrar el detalle del elemento. Esperado: no aparece la linea "Etapa actual..." (todo completo); tabla con Elemento = Galletas en 4 filas.
12. Buscador. Produccion semana 28 sep-4 oct, escribir "Fatima". Esperado: un solo chip, [4160] Alice Glas. 50/50 el vie 2 oct.

Record C: [4074] Gaby (recE62HJlH9SaIUoE). Entregado; 3 tareas (Horneado, Glaseado, Decorado; Sofia; 2 oct; Terminado) sin vinculo a elemento.
Este record es el que vas a utilizar para la prueba 13. Fecha para abrir: entrega de produccion 1 oct 2026.
13. Tareas sin elemento. Abrir la orden y ver "Produccion". Esperado: las 3 tareas aparecen con Elemento "—"; no cuentan para el tracker, asi que la linea "Etapa actual..." puede mostrar la primera etapa del elemento.

Record D: [4148] Blanca Valdes (recVNjMyWhvzgnU5t), elemento Galletas (reci9DOqt8jfWadNx). Entregado; una tarea Empacado Terminado 100/100 (Rach), sin otras etapas.
Este record es el que vas a utilizar para la prueba 14. Fecha para abrir: buscar "4148" en Pedidos.
14. Tracker con datos historicos. Abrir el elemento Galletas. Esperado por codigo: Horneado actual y Empacado pendiente aunque su tarea esta Terminado; la tabla muestra 1 fila Empacado 100/100.

Record E: [3413] Rosaura Avila (rec3OES0NemnxyyzY). Pendiente, entrega de produccion 15 oct 2026; elementos Pastel 50 pax x1 (recz8Ji9FYE6kbigU), Cupcakes x1 (recpJW3JQ8r2NqRkH), Galletas sin cantidad (rec4tGDzyPGC5Ao3x); sin tareas.
Este record es el que vas a utilizar para las pruebas 15 a 28. Fecha para abrir: calendario de Pedidos el 15 oct 2026. Las pruebas 15 a 23 son de lectura (no se guarda nada); las 24 a 28 escriben en Produccion.
15. Detalle, Pastel. Clic en Pastel 50 pax. Esperado: tracker de 4 etapas Horneado (actual), Embetunado, Decorado, Empacado; tabla "Sin tareas."; Cantidad 1.
16. Detalle, Cupcakes. Esperado: las mismas 4 etapas que Pastel.
17. Detalle, Galletas. Esperado: etapas Horneado, Glaseado, Decorado, Empacado; Cantidad "—".
18. Linea del pedido. Cerrar el detalle. Esperado: "Etapa actual del elemento mas atrasado: Horneado · (uno de los 3 elementos)"; tabla "Sin tareas.".
19. Formulario de nuevo elemento, sin guardar. "+" Agregar elemento. Sin producto no hay seccion; "Calendario de 12" y "Caja de reposteria" no muestran seccion; "Pastel 5 pax" y "Cupcakes" muestran Horneado, Embetunado, Decorado, Empacado; "Galletas" muestra Horneado, Glaseado, Decorado, Empacado. Esperado: el formulario se ensancha cuando aparece la seccion.
20. Valores prellenados. Con Galletas, Cantidad 25. Esperado: cada fila con Cant. 25, "Completada 0", Estatus Pendiente, titulo "[3413] Rosaura Avila · Etapa · 25" y "Manual · Pedido vinculado"; Empleado "Sin asignar"; al cambiar a 30 se actualizan titulos y cantidades.
21. Reglas de fecha en la creacion. Abrir Inicio y Fin de una fila. Esperado: dias antes del 5 oct y despues del 15 oct deshabilitados; Inicio 10 oct y luego Fin 8 oct mueve Inicio a 8 oct; Fin 12 oct y luego Inicio 14 oct mueve Fin a 14 oct.
22. Buscador de empleado en el formulario. Abrir un selector de Empleado y escribir "fa". Esperado: solo "Fatima" y "Sin asignar" arriba; la lista completa solo trae empleados de produccion (Mariana, Ale, Lalo, Rach, Sofia, Jacky, Fatima).
23. Cambio de producto. Con Galletas: Horneado a Ale el 6 oct, Decorado a Lalo el 7 oct, Glaseado a Jacky; cambiar a "Pastel 5 pax". Esperado: Horneado y Decorado conservan empleado y fechas, Glaseado desaparece y Embetunado aparece vacio; cerrar con clic afuera no crea registros.
24. ESCRIBE. "No" en etapa. Elemento Pastel 50 pax, clic en "Decorado" y "No". Esperado: una tarea nueva Decorado, titulo "[3413] Rosaura Avila · Decorado · 1", asignada 1, completada 0, Pendiente, Origen Manual, ligada al pedido y al elemento, sin empleado y sin fechas; tracker sin cambio; repetir "No" no duplica.
25. ESCRIBE. "Si" con secuencia. Mismo elemento, clic en "Decorado" y "Si". Esperado: se crean Horneado y Embetunado como Terminado 1/1 y Decorado pasa a Terminado 1/1; tracker con 3 marcas y Empacado actual. Luego cerrar el detalle del elemento y revisar el detalle del pedido: la especificacion pide ver las 3 tareas y Empacado como actual; por codigo seguira en "Sin tareas." hasta reabrirlo.
26. ESCRIBE. "Si" con todo faltante. Elemento Cupcakes, clic en "Empacado" y "Si". Esperado: 4 tareas creadas, todas Terminado 1/1 y "Sin asignar"; tracker con 4 marcas.
27. ESCRIBE. Crear elemento con tareas. "+" Agregar elemento, "Galletas", Cantidad 2, Horneado a Ale con inicio 6 oct y fin 7 oct, resto vacio, clic en "Crear" dos veces rapido. Esperado: 1 elemento y 4 tareas (Horneado con Ale y fechas; las otras 3 "Sin asignar" y sin fechas), Pendiente 0/2, ligadas al elemento y al pedido, sin duplicados.
28. ESCRIBE. Editar fecha de una tarea. Abrir la tarea Horneado de la prueba 27 y cambiar Inicio al 9 oct. Esperado: aparece "Cambios guardados" y al reabrir queda la fecha nueva.
Limpieza despues de 24 a 28: eliminar las tareas creadas desde el formulario de cada tarea (icono de basura) y luego el elemento de la prueba 27 desde "Editar"; estado final esperado: 0 tareas para [3413] y 3 elementos. El aviso por falla de escritura y "Reintentar tareas" no se pueden probar sin forzar un error; solo se revisaron en codigo.


4. CORRECTION PROMPT (para Canvas)

# Canvas Prompt 2/4 — Corrección

## Modo
Edición de un proyecto existente de Canvas (app de Amaranta Cakes). Aplica SOLO los dos puntos de abajo. Base: Producción (appSQk87nF0WpH2gi). Usa siempre IDs de tablas y campos. No crees ni cambies tablas, campos ni automatizaciones.

## Qué corregir
1. El detalle del pedido no se actualiza tras cambios hechos desde el detalle del elemento.
   - Hoy la tabla de tareas y la línea "Etapa actual del elemento más atrasado" del detalle del pedido (PedidoTareasSection) usan su propia carga de datos y no se actualizan cuando, desde el detalle del elemento, se completa una etapa, se crea una tarea o se crea un elemento con "Agregar elemento".
   - Haz que en esos tres casos el detalle del pedido se actualice sin recargar la página y sin cerrar ninguna ventana.
2. Aviso claro cuando falla una escritura a mitad de la secuencia "Sí".
   - Si falla la escritura al completar etapas, el aviso debe decir qué etapas sí se guardaron, por ejemplo: "No se pudo completar la etapa. Se guardaron: Horneado, Embetunado. Inténtalo de nuevo.", y el tracker debe mostrar el estado real tras refrescar.
   - No borres tareas ni hagas rollback.

## Tablas y campos involucrados
- Tareas de producción (tblESlAFi4WqHlJtk), Elementos (tblis88Izkhbi3SIG), Pedidos (tbl4izLZNlOcem1SC). No se agregan escrituras nuevas.

## No tocar
[PEGAR AQUÍ: No tocar y contratos C1-C3]

## Criterios de aceptación
- Completar una etapa desde el detalle del elemento actualiza, sin recargar, la tabla y la línea del detalle del pedido que está debajo.
- Crear un elemento con tareas desde el detalle del pedido muestra de inmediato esas tareas en la tabla del pedido.
- Si falla una escritura en la secuencia "Sí", el aviso lista las etapas guardadas y el tracker refleja el estado real.
- Nada más cambia: la página de Producción y los cálculos de galletas se ven igual que antes.

## Entrega
Al terminar, envíame un reporte (qué cambió y qué no pudiste probar) y un export completo (ZIP, README y transcript) con la versión subida a 1.5.1.


Tell me: respuestas a los pendientes 1 a 5.

Iteration log entry: 2 | Step 5 feedback audit | Needs correction | 25 PASS, 2 PARTIAL, 0 FAIL, schema OK
```


---

CIERRE DEL PROMPT 2 (actualizado tras la v1.8.4)

Estado: PASS. Todas las pruebas están cerradas (50 y 54 omitidas por decisión de Axel; 38 sin pruebas de tema). Detalle de pruebas y resultados en `smoke-tests.md` de esta carpeta.

Versiones auditadas: v1.5.0 (informe de arriba), v1.6.0, v1.7.0, v1.8.0, v1.8.1, v1.8.2, v1.8.3 y v1.8.4.
- Regresión en v1.8.0: se perdieron la actualización automática y las dependencias; se detectó comparando `lib/airtable-hooks.tsx` y `package.json` contra la versión previa y se corrigió en v1.8.1.
- v1.8.2 y v1.8.3: `lib/airtable-hooks.tsx` y `package.json` sin cambios. En v1.8.3 el borrado de un elemento no borraba sus tareas (prueba 56 FALLA); se corrigió en v1.8.4.
- v1.8.4: `lib/airtable-hooks.tsx` y `package.json` sin cambios. El borrado lee las tareas directo de Airtable, las borra, confirma que no queden y borra el elemento.
- Estado final de datos verificado en Airtable: [3413] Rosaura Avila con 3 elementos y 0 tareas.

Notas abiertas (no son defectos; Axel decidió dejarlas como notas)
- Las tareas conservan la cantidad asignada original si cambia la cantidad del elemento.
- Al reabrir el detalle de un elemento se vio un instante "Pedido —" con la sección de tareas vacía.
- La descripción del elemento se guarda con un salto de línea al final.
- El panel "Por atender" y los KPI no usan el filtro de empleado.
- "Reintentar tareas" se mantiene como nota.
- `produccion/airtableDirect.ts` llama al proxy sin pasar por `lib/airtable-hooks.tsx`; depende de sus exports BASE_ID y PROJECT_ID.

Iteration log entry: 5 | Prompt 2 fix v1.8.4 | Pass | 55-58 OK, 50 y 54 omitidas, schema OK, hooks y package sin cambios, [3413] limpio (3 elementos, 0 tareas), 6 notas abiertas
