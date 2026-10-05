# Smoke tests — Prompt 2/4 (detalle del elemento y tareas)

Export probado: v1.5.0 (2026-10-05). Base: Producción (`appSQk87nF0WpH2gi`).
Estado: pendientes solo las pruebas que escriben datos en [3413], la 48 (retest en v1.8.2) y la 49. Las demás están cerradas (39, 40, 47, 48, 50 y 52 hechas) (54 omitida) y al final del archivo. Revisión por código de la v1.8.1: auto-refresco y dependencias restaurados. Fecha de hoy en las pruebas: domingo 4 oct 2026 (hora local de Axel).
Versión: las pruebas 1 a 11 se hicieron con v1.5.0; desde la prueba 12 la app publicada es v1.6.0, donde el buscador por empleado se reemplazó por el filtro "Todo el equipo" y Producción tiene un buscador de pedidos.

Reglas
- Las pruebas 1 a 23 solo abren pantallas. Cierra los pop-ups con clic en el área oscura, sin pulsar "No" ni "Sí".
- Las pruebas 24 a 28 escriben en Producción y corren solo en [3413] Rosaura Avila (`rec3OES0NemnxyyzY`).
- Selector de vista en Producción (arriba a la derecha): Día, Todos (vista semanal), Grandes, Regulares.
- "Pop-up del pedido" = ventana que se abre al hacer clic en un pedido en Pedidos. "Detalle del elemento" = segundo pop-up que se abre al hacer clic en una fila de la tabla Elementos.

## v1.8.1 — [3413] Rosaura Avila (ESCRIBEN datos, en este orden)

Datos de arranque creados por Claude en Airtable (autorizado por Axel): elemento "Pastel 5 pax" cantidad 2 (`recB0qNl6UbaGZqcJ`) en [3413] con 4 tareas, todas Pendiente 0/2 y Origen Manual: Horneado (Ale, 5 a 7 oct), Embetunado (sin empleado, 7 a 8 oct), Decorado y Empacado (sin empleado ni fechas). La prueba 49 se hacen sobre este elemento, ya creado: no lo crees de nuevo. La prueba 39 no guarda nada (cierra el pop-up sin pulsar "Crear"). El elemento y sus tareas se borran al final con la prueba 49. Tras la prueba 40 las fechas quedaron: Horneado 5 a 9 oct, Embetunado 9 a 9 oct.

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| 48 | [3413] Rosaura Avila (ESCRIBE) | En el detalle del elemento de prueba haz clic en "Decorado" y pulsa "Sí". | El tracker y la tabla cambian al instante, sin demora visible; Horneado, Embetunado y Decorado quedan Terminado con completada igual a asignada (las tareas conservan asignada 2, así que se espera 2/2); Empacado sigue Pendiente. Verifica en Airtable. | Pendiente de retest en v1.8.2 (datos reiniciados). Resultado en v1.8.1: FALLA parcial (la tabla pasó a Terminada 2/2 en Horneado, Embetunado y Decorado y Airtable lo confirma, pero el tracker (pipeline) siguió con Horneado como actual y sin palomitas; va al prompt de corrección) |
| 49 | [3413] Rosaura Avila (ESCRIBE) | Antes de borrar: cierra y reabre el detalle del elemento y revisa si el tracker ya muestra 3 palomitas. Luego pulsa el icono de basura y confirma "¿Eliminar elemento?". | El elemento se borra y el detalle se cierra. Revisa en Airtable qué pasó con sus tareas (si quedan sin elemento, bórralas). | Pendiente (v1.8.1) |
# Sets cerrados

## [4128] Sara (`recZCPIvYm7J76UX1`) — abrir el 1 oct 2026 en Pedidos

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 1 | En Pedidos abre el pedido y haz clic en la fila "Galletas". | Se abre el detalle del elemento: título "Galletas", Cantidad 10, Pedido [4128] Sara y botón "Editar". | OK |
| 2 | Revisa el tracker del detalle del elemento. | Horneado aparece como etapa actual (círculo con punto); Glaseado, Decorado y Empacado en gris, sin palomitas. | OK |
| 3 | Revisa la tabla de tareas del detalle del elemento. | 4 filas (Horneado, Glaseado, Decorado, Empacado) sin columna "Elemento". Empleados Ale, Lalo, Lalo y "Sin asignar"; avance 0/10. | OK |
| 4 | Cierra el detalle y revisa "Producción" en el pop-up del pedido. | Línea "Etapa actual del elemento más atrasado: Horneado · Galletas" y tabla con columna "Elemento", sin tracker ni botón "+". | OK |
| 5 | Haz clic en la fila Empacado de la tabla. | Se abre el formulario de la tarea con Empleado "Sin asignar". No se escribe nada si no cambias un campo. | OK |
| 6 | En ese formulario abre los selectores de fecha de inicio y de fin. | Todos los días salen deshabilitados (entrega de producción el 1 oct, tarea creada el 2 oct). | OK |
| 7 | En el detalle del elemento haz clic en el círculo "Glaseado" y cierra el mini pop-up "¿Completar tarea?" con clic afuera. | No cambia nada: Glaseado sigue Pendiente 0/10 y siguen 4 tareas. | OK |
| 8 | En Producción elige la vista "Todos", ve a la semana 5-11 oct y escribe "Lalo" en "Buscar empleado…". | Solo queda la fila de Lalo con sus 2 tareas del lunes 5 ([4128] Sara Deco. y Glas., 0/10). Al borrar el texto vuelve todo el equipo. | OK |
| 9 | En Producción elige la vista "Día", ve al viernes 2 oct y escribe "Ale". | Queda Ale con 2 tareas (1 hecha, la de [4160] Alice). No hay porcentaje de carga ni botón "Capacidades". | OK |

## [4160] Alice (`rec2FnINtW50a2LFW`) — abrir el 30 sep 2026 en Pedidos (si no aparece, buscar "4160")

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 10 | En Pedidos abre el pedido y haz clic en la fila "Galletas" para abrir el detalle del elemento. | El tracker muestra las 4 etapas con palomita y ninguna se puede pulsar (sin zoom al pasar el cursor). La tabla de tareas tiene 4 filas con avance 50/50 y ritmo "Terminada". | OK |
| 11 | Cierra el detalle del elemento y revisa la sección "Producción" del pop-up del pedido. | No aparece la línea "Etapa actual del elemento más atrasado…" porque todo está completo. La tabla muestra las 4 tareas con "Galletas" en la columna "Elemento". | OK |
| 12 | Ve a la página Producción, elige la vista "Todos", ve a la semana 28 sep-4 oct y filtra por "Fátima" (en la versión publicada del 5 oct el filtro por empleado es el selector "Todo el equipo"; la caja de búsqueda decía "Buscar pedido…"). | Solo queda la fila de Fátima en el tablero, con un chip: [4160] Alice Glas. 50/50 el viernes 2 oct. Al borrar el texto vuelve todo el equipo. | OK |

## [4074] Gaby (`recE62HJlH9SaIUoE`) — abrir el 1 oct 2026 en Pedidos

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 13 | Abre el pedido y revisa la sección "Producción" del pop-up. | La tabla muestra 3 tareas (Horneado, Glaseado, Decorado, de Sofía) con "—" en la columna "Elemento", porque no están ligadas a ningún elemento. La línea "Etapa actual…" puede mostrar la primera etapa del elemento del pedido, ya que esas tareas no cuentan para el tracker. | OK |

## [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`) — buscar "4148" en Pedidos

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 14 | Abre el pedido y haz clic en la fila "Galletas" para ver el tracker. | La tabla muestra 1 fila: Empacado, Rach, 100/100. Hoy el tracker marca Horneado como actual y Empacado como pendiente. Tras la corrección, las 4 etapas deben verse completas, solo en pantalla y sin crear tareas. | OK (hoy; el expected final llega con la corrección) |

## [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) — abrir el 15 oct 2026 en Pedidos, solo lectura

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 15 | Abre el pedido y haz clic en la fila "Pastel 50 pax". | El tracker muestra 4 etapas: Horneado (actual), Embetunado, Decorado y Empacado. La tabla dice "Sin tareas." y la cantidad es 1. | OK |
| 16 | Cierra el detalle y abre la fila "Cupcakes". | Las mismas 4 etapas que Pastel (Horneado, Embetunado, Decorado, Empacado) y "Sin tareas.". | OK |
| 17 | Cierra el detalle y abre la fila "Galletas". | Etapas Horneado, Glaseado, Decorado y Empacado (con Glaseado, sin Embetunado). La cantidad se ve "—" porque el elemento no tiene cantidad. | OK |
| 18 | Cierra el detalle y revisa "Producción" en el pop-up del pedido. | Aparece "Etapa actual del elemento más atrasado: Horneado · (uno de los 3 elementos)" y la tabla dice "Sin tareas.". | OK |
| 19 | En la tabla Elementos del pedido pulsa "+" para abrir "Agregar elemento". Prueba estos productos sin guardar: ninguno, "Calendario de 12", "Caja de repostería", "Pastel 5 pax", "Cupcakes", "Galletas". Cierra con clic afuera. | Sin producto, con "Calendario de 12" y con "Caja de repostería" no aparece la sección "Tareas de producción". Con "Pastel 5 pax" y "Cupcakes" aparecen 4 filas (Horneado, Embetunado, Decorado, Empacado). Con "Galletas" aparecen 4 filas (Horneado, Glaseado, Decorado, Empacado). El formulario se ensancha cuando aparece la sección. | OK |
| 20 | En "Agregar elemento" elige "Galletas" y escribe Cantidad 25; luego cámbiala a 30. No guardes. | Hoy cada fila muestra Cant. 25, "Completada 0", Estatus Pendiente, título "[3413] Rosaura Avila · Etapa · 25" y Empleado "Sin asignar". Tras la corrección la tabla solo tendrá Etapa (chip de color), Empleado, Inicio y Fin; título, cantidad y estatus ya no se ven y se verifican al guardar (prueba 27) en Airtable. | OK (cantidades 25 y 30 se actualizan; el título sale cortado, su valor se verifica en Airtable tras la prueba 27) |
| 21 | En esa misma tabla abre los selectores "Inicio" y "Fin" de una fila. Elige Inicio 10 oct y luego Fin 8 oct; después Fin 12 oct y luego Inicio 14 oct. | Solo se pueden elegir días del 4 al 15 oct (hoy es el domingo 4 oct en hora local; los días anteriores y los posteriores a la entrega de producción están deshabilitados). Al elegir Fin 8 con Inicio 10, el Inicio pasa a 8. Al elegir Inicio 14 con Fin 12, el Fin pasa a 14: manda la última fecha elegida. | OK (ajuste de fechas y días deshabilitados confirmados: habilitados del 4 al 15 oct) |
| 22 | Abre el selector "Empleado" de una fila y escribe "fa". | Solo aparecen "Sin asignar" arriba y "Fátima". La lista completa trae únicamente empleados de producción (Mariana, Ale, Lalo, Rach, Sofía, Jacky, Fátima). | OK |
| 23 | Con "Galletas" seleccionado pon Horneado → Ale con inicio 6 oct, Decorado → Lalo con inicio 7 oct y Glaseado → Jacky. Cambia el producto a "Pastel 5 pax" y cierra con clic afuera. | Horneado y Decorado conservan empleado y fechas. La fila Glaseado desaparece y aparece Embetunado vacío. Al cerrar no se crea ningún registro. | OK |

## v1.7.0 — [4148] Blanca Valdes y [4128] Sara

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| 29 | [4148] Blanca Valdes | En Pedidos busca "4148", abre el pedido y haz clic en la fila "Galletas". | La tabla sigue con 1 tarea (Empacado 100/100). El tracker muestra las 4 etapas completas aunque no tengan tareas. No se crea ningún registro. En el pop-up del pedido no aparece la línea "Etapa actual…". | OK |
| 30 | [4128] Sara | Abre el pedido (1 oct), clic en la fila "Galletas" y clic en el círculo "Glaseado". Prueba cerrarlo con clic afuera y con Esc. | Aparece un globo pequeño junto a la etapa, sin fondo oscuro, con "¿Completar tarea?", el texto "Sí: completa esta etapa y las anteriores. No: solo crea la tarea, sin completar." y los botones "Sí" y "No" del mismo ancho. "Sí" no tiene foco automático. Se cierra con clic afuera y con Esc sin escribir nada; siguen 4 tareas. | OK (funciona cerrar con clic afuera y con Esc; cambio pedido: quitar el texto explicativo, dejar solo "Sí" y "No") |
| 31 | [4128] Sara | En el detalle del elemento pulsa "Editar" y luego Esc; después Esc otra vez. No cambies ningún campo. | El primer Esc cierra solo el modal "Editar elemento" y el detalle sigue abierto. El segundo Esc cierra el detalle. | Obsoleta: "Editar" abre un modal y se reemplaza por edición en línea de los campos del detalle; se probará con la corrección |
| 32 | [4128] Sara | Abre el pedido, clic en la fila Horneado de la tabla de tareas y abre el selector de fechas. No cambies nada. | Aparece el aviso "La entrega de producción de este pedido ya pasó. Cambia esa fecha en el pedido para poder fechar la tarea." en lugar del mensaje "anterior a hoy". Todos los días siguen deshabilitados. En una tarea ya creada el Inicio no se puede quitar, solo el Fin. | OK (aviso funciona; cambio pedido: texto más corto) |

## v1.7.0 — [3413] Rosaura Avila (solo lectura)

Records: [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`), [4128] Sara (`recZCPIvYm7J76UX1`), [3413] Rosaura Avila (`rec3OES0NemnxyyzY`). Rutas como en las pruebas anteriores.

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| 33 | [3413] Rosaura Avila | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > en Elementos pulsa "+" (pop-up "Agregar Elemento") > elige "Galletas" > abre el selector "Empleado" de una fila y usa flecha abajo, flecha arriba, Enter y Escape. Cierra el pop-up con clic afuera. | Las flechas mueven la opción resaltada (da la vuelta al llegar al final o al inicio) y la lista se desplaza para mantenerla visible; el mouse también resalta. Enter elige la resaltada y Escape cierra la lista. No se crea ningún registro. | OK |
| 34 | [3413] Rosaura Avila | Página Producción > vista "Todos" > abre el filtro "Todo el equipo" y el selector de vista y prueba flechas, Enter y Escape. | Mismo comportamiento de teclado que en la prueba 32 en todos los dropdowns. El diseño del tablero y de la vista Día no cambia. | OK |
| 35 | [3413] Rosaura Avila | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > en Elementos pulsa "+" (pop-up "Agregar Elemento") > elige "Pastel 5 pax" y cantidad 30 > en la sección "Tareas de producción" del mismo pop-up elige fechas en dos filas. | La tabla muestra solo Etapa (chip con el color de la etapa), Empleado, Inicio y Fin; no hay Título, Cant. ni Estatus. No hay scroll horizontal ni columnas cortadas con fechas elegidas. | OK |
| 36 | [3413] Rosaura Avila | En el mismo pop-up "Agregar Elemento" (Pedidos > [3413] Rosaura Avila > "+"), sección "Tareas de producción": clic en "Inicio" de una fila, elige el 8 oct y luego el 10 oct; abre "Fin" de la misma fila; usa la "X" de Inicio y de Fin. | Un solo calendario: elegir el inicio no lo cierra y la siguiente selección es el fin; el periodo 8-10 oct queda resaltado. Tocar "Fin" abre el mismo calendario. Cada "X" limpia su fecha. Solo se pueden elegir días del 4 al 15 oct. Dejar fechas vacías es válido. | OK |
| 37 | [3413] Rosaura Avila | Regresión de Esc, en tres lugares: (a) página Pedidos > abre [3413] Rosaura Avila > abre el cake topper (pop-up) y pulsa Esc; (b) página Pedidos > "Nuevo pedido" (pop-up) y pulsa Esc; (c) página Producción > vista "Día" > clic en un pedido de "Por atender" (pop-up) y pulsa Esc. | Cada Esc cierra solo la capa superior y no se guarda nada. | OK |
| 38 | [3413] Rosaura Avila | Repite las pruebas 30 y 36 en modo claro y modo oscuro (botón de tema del menú lateral) y con la ventana angosta (celular). | El globo, el calendario de rango y los dropdowns se ven bien y se pueden usar en los tres casos. | Omitida (Axel decidió no probar tema claro/oscuro) |

## [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) — ESCRIBEN datos en Producción

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 24 | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > fila "Pastel 50 pax" (detalle del elemento) > clic en el círculo "Decorado" y pulsa "No" en el globo. Repite el clic y "No". | Se crea 1 tarea: Decorado, título "[3413] Rosaura Avila · Decorado · 1", asignada 1, completada 0, Pendiente, Origen Manual, ligada al pedido y al elemento, sin empleado ("Sin asignar") y sin fechas. El tracker no cambia (Horneado sigue como actual). La segunda vez no se duplica. | OK (verificado en Airtable: 1 sola tarea Decorado, sin duplicado) |
| 25 | En el mismo detalle de "Pastel 50 pax": clic en "Decorado" y pulsa "Sí". Cierra el detalle y mira el pop-up del pedido (sección "Producción") sin reabrirlo. | Se crean Horneado y Embetunado como Terminado 1/1 y Decorado pasa a Terminado 1/1. El tracker muestra 3 palomitas y Empacado como actual. El pop-up del pedido debe mostrar las 3 tareas y la línea de etapa actualizada sin reabrirse (hoy falla: sigue con datos viejos). | OK (verificado en Airtable: Horneado, Embetunado y Decorado Terminado 1/1; el detalle del pedido se actualizó y ordena bien; cambio pedido: la respuesta al pulsar "Sí" debe ser inmediata, hoy tarda un poco) |
| 26 | Página Pedidos > [3413] Rosaura Avila > fila "Cupcakes" (detalle del elemento) > clic en "Empacado" y pulsa "Sí". | Se crean 4 tareas (Horneado, Embetunado, Decorado, Empacado), todas Terminado 1/1 y "Sin asignar". El tracker muestra las 4 palomitas. | OK (verificado en Airtable: 4 tareas Terminado 1/1; cambio pedido: quitar el texto del globo) |
| 27 | Página Pedidos > [3413] Rosaura Avila > en Elementos pulsa "+" (pop-up "Agregar Elemento") > "Galletas", Cantidad 2 > en "Tareas de producción" pon Horneado → Ale con el calendario de rango (inicio 6 oct, fin 7 oct), deja lo demás vacío y pulsa "Crear" dos veces seguidas. | Se crea 1 elemento y 4 tareas, todas Pendiente 0/2 y ligadas al elemento y al pedido. Horneado lleva Ale y las fechas; las otras 3 salen "Sin asignar" y sin fechas. No hay duplicados. | OK (verificado en Airtable: 1 elemento Galletas nuevo y 4 tareas Pendiente 0/2 ligadas al elemento y al pedido; Horneado con Ale; sin duplicados al pulsar Crear dos veces) |
| 28 | Página Pedidos > [3413] Rosaura Avila > fila del elemento creado en la prueba 27 (detalle del elemento) > clic en su fila Horneado (formulario de la tarea) > cambia "Fecha de inicio" al 9 oct. Ciérralo y vuelve a abrirlo. | Aparece "Cambios guardados" y, al reabrir, la fecha de inicio es el 9 oct. | OK (verificado en Airtable: Horneado con inicio y fin 9 oct; el fin se ajustó solo al mover el inicio) |

Limpieza después de las pruebas 24 a 28: borra las tareas creadas (icono de basura en el formulario de cada tarea) y luego el elemento de la prueba 27 desde "Editar". Estado final esperado: 0 tareas y 3 elementos en [3413].

Limpieza hecha (autorizada por Axel): se borraron las 11 tareas de prueba y el elemento Galletas nuevo (`rec4y37pNvUupXVWj`) de [3413] Rosaura Avila. Estado final verificado en Airtable: 0 tareas y 3 elementos. Para las pruebas 39 y 40 habrá que crear tareas con fechas de nuevo.

Limpieza de la prueba 40 hecha (autorizada por Axel): se borraron el elemento "Pastel 5 pax" nuevo (`rechgYrJvTX7AjMnx`) y sus 4 tareas. Estado final verificado en Airtable: [3413] Rosaura Avila con 3 elementos y 0 tareas. Observación: ese elemento se creó sin cantidad, por eso las tareas salieron con cantidad asignada 0 y título "· 0".

## v1.8.0 — [4128] Sara (solo lectura)

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| 41 | [4128] Sara | Página Pedidos > abre [4128] Sara (1 oct) > fila "Galletas" (detalle del elemento). No cambies ningún campo. | No existe el botón "Editar". Los campos Producto, Cantidad, Costo unitario y Descripción se ven editables en su lugar; "Nombre" y "Pedido" son de solo lectura. Hay un icono de basura en el encabezado. | OK (cambio pedido: quitar el campo "Nombre" y mostrar primero "Pedido" y luego "Producto") |
| 42 | [4128] Sara | En el mismo detalle del elemento haz clic en el círculo "Glaseado". Ciérralo con clic afuera y con Esc. | El globo muestra solo "¿Completar tarea?" y los botones "Sí" y "No", sin texto explicativo. Cierra con clic afuera y con Esc sin escribir; siguen 4 tareas. | OK |
| 43 | [4128] Sara | Cierra el detalle del elemento y revisa la sección "Producción" del pop-up del pedido. | Una sola tabla, con el subtítulo "Galletas" arriba; columnas Etapa, Empleado, Inicio, Fin, Avance y Ritmo (sin columna "Elemento"); filas Horneado, Glaseado, Decorado, Empacado. La línea "Etapa actual del elemento más atrasado" sigue arriba. | OK |
| 44 | [4128] Sara | En esa tabla clic en la fila Horneado (formulario de la tarea) > abre "Fecha de inicio". No cambies nada. | Aparece "No se puede editar: la entrega de producción ya pasó." y todos los días siguen deshabilitados. | OK (aviso correcto; cambio pedido: poder editar Empleado, Inicio y Fin directamente en la tabla de tareas) |

## v1.8.0 — [3413] Rosaura Avila (solo lectura)

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| 45 | [3413] Rosaura Avila | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > sección "Producción" del pop-up. | Tres subtítulos ("Pastel 50 pax", "Cupcakes", "Galletas"), cada uno con su tabla y el texto "Sin tareas.". | OK (nota: los subtítulos salen Galletas, Cupcakes, Pastel 50 pax; deberían seguir el orden de la tabla Elementos: Pastel 50 pax, Cupcakes, Galletas) |
| 46 | [3413] Rosaura Avila | Abre el detalle de "Galletas", pulsa el icono de basura del encabezado y luego "Cancelar" en la confirmación. | Aparece la confirmación "¿Eliminar elemento?"; al cancelar no se borra nada y el detalle sigue abierto. | OK (la confirmación "¿Eliminar elemento?" con "Cancelar" y "Confirmar" funciona; cambio pedido: quitar un icono de X, por confirmar cuál) |

## v1.8.1 — [3413] Rosaura Avila (solo lectura)

| # | Record | Prueba | Expected | Estado |
|---|---|---|---|---|
| 51 | [3413] Rosaura Avila | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > fila "Galletas" (detalle del elemento). | La primera fila de datos muestra "Pedido" y luego "Producto" (editable); ya no aparece el campo "Nombre". El encabezado tiene solo el título y el icono de basura, sin "X"; el detalle se cierra con Esc y con clic afuera. | OK |
| 53 | [3413] Rosaura Avila | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > sección "Producción" del pop-up. | Los subtítulos siguen el orden de la tabla Elementos: Pastel 50 pax, Cupcakes, Galletas. | OK |
| 54 | Sin record | Página Pedidos > menú de descarga (solo usuarios autorizados) > pulsa "source.zip", "source.pdf", "readme.md" y "readme.pdf". | Los cuatro archivos se descargan y abren; el ZIP trae el código de la v1.8.1 con su README. No escribe en Airtable. | Omitida (decisión de Axel) |
| 39 | [3413] Rosaura Avila (no escribe) | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > en Elementos pulsa "+" (pop-up "Agregar Elemento") > elige "Pastel 5 pax" > en "Tareas de producción" pon Horneado del 5 al 7 oct y abre el selector de "Inicio" de Embetunado. Después cambia el fin de Horneado al 9 oct. Cierra con clic afuera, sin pulsar "Crear". | Embetunado solo permite elegir desde el 7 oct (el fin de Horneado) en adelante; los días anteriores salen deshabilitados. Lo mismo aplica a Decorado respecto a Embetunado y a Empacado respecto a Decorado. Al mover el fin de Horneado al 9 oct, las fechas de las etapas siguientes que quedaron antes del 9 se ajustan al 9 oct. No se crea ningún registro. | OK (Embetunado habilitado desde el 7 oct; al mover el fin de Horneado al 9, Embetunado pasó a inicio 9; Decorado y Empacado no se ejercitaron porque estaban vacíos) |
| 40 | [3413] Rosaura Avila (elemento de prueba ya creado: Horneado 5-7 oct, Embetunado 7-8 oct) | Página Pedidos > abre [3413] Rosaura Avila (15 oct) > en Elementos abre "Pastel 5 pax" (detalle del elemento) > clic en la fila Embetunado (formulario de la tarea) > abre "Fecha de inicio". Cierra el formulario. Después abre la fila Horneado y cambia su "Fecha de fin" al 9 oct. Vuelve a abrir la fila Embetunado. | En el formulario de la tarea Embetunado solo se pueden elegir días desde el 7 oct (el fin de Horneado). Al mover el fin de Horneado al 9 oct, las fechas de Embetunado (inicio 7, fin 8) se ajustan solas al 9 oct. Verifica en Airtable. | OK (formulario de Embetunado habilitado desde el 7 oct; verificado en Airtable: Horneado 5-9 oct, Embetunado 9-9 oct) |
| 47 | [3413] Rosaura Avila (ESCRIBE) | En el detalle del elemento de prueba (Pastel 5 pax, cantidad 2): cambia "Cantidad" a 3 y la "Descripción" a "prueba"; intenta dejar el producto vacío. Cierra y reabre el detalle. | Aparece "Cambios guardados" en cada cambio; al reabrir quedan cantidad 3 y descripción "prueba". El producto no se puede dejar vacío. Verifica los valores en Airtable. | OK (producto vacío rechazado con mensaje; verificado en Airtable: cantidad 3, descripción "prueba"; las tareas conservan asignada 2. Observación: al reabrir el detalle se vio un instante "Pedido —" y la sección de tareas vacía) |
| 52 | [3413] Rosaura Avila (ESCRIBE) | Con el elemento de prueba (Horneado con Ale; Decorado y Empacado sin empleado): en la tabla de tareas del detalle del elemento y en la del pop-up del pedido cambia directamente el "Empleado", el "Inicio" y el "Fin" de una fila. | Los tres campos se editan en la misma celda de la tabla y se guardan solos; las demás celdas siguen abriendo el formulario de la tarea. Se aplican las reglas de fechas (secuenciales, rango, entrega pasada con "No se puede editar: la entrega de producción ya pasó."). Verifica en Airtable. | OK (Empleado, Inicio y Fin se editan en la celda y se guardan; verificado en Airtable: Decorado con Fátima, 9-9 oct. Empacado quedó con Rach, 12-12 oct, verificado en Airtable. En una captura anterior el desplegable de Empleado de la última fila se cortó al fondo de la ventana; en la última sale completo y hacia arriba, por lo que la corrección se mantiene para cubrir todos los casos) |
| 50 | [3413] Rosaura Avila (ESCRIBE) | Abre Pedidos en dos pestañas con [3413] abierto. En la pestaña A cambia la "Cantidad" del elemento de prueba; espera 30 segundos y mira la pestaña B sin recargar. | La pestaña B se actualiza sola con la cantidad nueva (actualización automática cada 30 s). Hoy no se cumple: se perdió en la v1.8.0 (ver observaciones). | Omitida (decisión de Axel) |
