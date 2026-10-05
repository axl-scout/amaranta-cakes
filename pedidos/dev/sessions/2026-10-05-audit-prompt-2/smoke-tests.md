# Smoke tests — Prompt 2/4 (detalle del elemento y tareas)

Export probado: v1.5.0 (2026-10-05). Base: Producción (`appSQk87nF0WpH2gi`).
Estado: pruebas 13 a 28 pendientes. Los sets cerrados van al final del archivo (pruebas 1 a 12 cerradas).
Versión: las pruebas 1 a 11 se hicieron con v1.5.0; desde la prueba 12 la app publicada es v1.6.0, donde el buscador por empleado se reemplazó por el filtro "Todo el equipo" y Producción tiene un buscador de pedidos.

Reglas
- Las pruebas 1 a 23 solo abren pantallas. Cierra los pop-ups con clic en el área oscura, sin pulsar "No" ni "Sí".
- Las pruebas 24 a 28 escriben en Producción y corren solo en [3413] Rosaura Avila (`rec3OES0NemnxyyzY`).
- Selector de vista en Producción (arriba a la derecha): Día, Todos (vista semanal), Grandes, Regulares.
- "Pop-up del pedido" = ventana que se abre al hacer clic en un pedido en Pedidos. "Detalle del elemento" = segundo pop-up que se abre al hacer clic en una fila de la tabla Elementos.

## [4074] Gaby (`recE62HJlH9SaIUoE`) — abrir el 1 oct 2026 en Pedidos

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 13 | Abre el pedido y revisa la sección "Producción" del pop-up. | La tabla muestra 3 tareas (Horneado, Glaseado, Decorado, de Sofía) con "—" en la columna "Elemento", porque no están ligadas a ningún elemento. La línea "Etapa actual…" puede mostrar la primera etapa del elemento del pedido, ya que esas tareas no cuentan para el tracker. | Pendiente |

## [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`) — buscar "4148" en Pedidos

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 14 | Abre el pedido y haz clic en la fila "Galletas" para ver el tracker. | La tabla muestra 1 fila: Empacado, Rach, 100/100. Hoy el tracker marca Horneado como actual y Empacado como pendiente. Tras la corrección, las 4 etapas deben verse completas, solo en pantalla y sin crear tareas. | Pendiente |

## [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) — abrir el 15 oct 2026 en Pedidos, solo lectura

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 15 | Abre el pedido y haz clic en la fila "Pastel 50 pax". | El tracker muestra 4 etapas: Horneado (actual), Embetunado, Decorado y Empacado. La tabla dice "Sin tareas." y la cantidad es 1. | Pendiente |
| 16 | Cierra el detalle y abre la fila "Cupcakes". | Las mismas 4 etapas que Pastel (Horneado, Embetunado, Decorado, Empacado) y "Sin tareas.". | Pendiente |
| 17 | Cierra el detalle y abre la fila "Galletas". | Etapas Horneado, Glaseado, Decorado y Empacado (con Glaseado, sin Embetunado). La cantidad se ve "—" porque el elemento no tiene cantidad. | Pendiente |
| 18 | Cierra el detalle y revisa "Producción" en el pop-up del pedido. | Aparece "Etapa actual del elemento más atrasado: Horneado · (uno de los 3 elementos)" y la tabla dice "Sin tareas.". | Pendiente |
| 19 | En la tabla Elementos del pedido pulsa "+" para abrir "Agregar elemento". Prueba estos productos sin guardar: ninguno, "Calendario de 12", "Caja de repostería", "Pastel 5 pax", "Cupcakes", "Galletas". Cierra con clic afuera. | Sin producto, con "Calendario de 12" y con "Caja de repostería" no aparece la sección "Tareas de producción". Con "Pastel 5 pax" y "Cupcakes" aparecen 4 filas (Horneado, Embetunado, Decorado, Empacado). Con "Galletas" aparecen 4 filas (Horneado, Glaseado, Decorado, Empacado). El formulario se ensancha cuando aparece la sección. | Pendiente |
| 20 | En "Agregar elemento" elige "Galletas" y escribe Cantidad 25; luego cámbiala a 30. No guardes. | Cada fila muestra Cant. 25, "Completada 0", Estatus Pendiente, título "[3413] Rosaura Avila · Etapa · 25" (por ejemplo "· Horneado · 25") y "Manual · Pedido vinculado"; Empleado "Sin asignar". Al poner 30 se actualizan cantidades y títulos. | Pendiente |
| 21 | En esa misma tabla abre los selectores "Inicio" y "Fin" de una fila. Elige Inicio 10 oct y luego Fin 8 oct; después Fin 12 oct y luego Inicio 14 oct. | Solo se pueden elegir días del 5 al 15 oct (antes de hoy y después de la entrega de producción están deshabilitados). Al elegir Fin 8 con Inicio 10, el Inicio pasa a 8. Al elegir Inicio 14 con Fin 12, el Fin pasa a 14: manda la última fecha elegida. | Pendiente |
| 22 | Abre el selector "Empleado" de una fila y escribe "fa". | Solo aparecen "Sin asignar" arriba y "Fátima". La lista completa trae únicamente empleados de producción (Mariana, Ale, Lalo, Rach, Sofía, Jacky, Fátima). | Pendiente |
| 23 | Con "Galletas" seleccionado pon Horneado → Ale con inicio 6 oct, Decorado → Lalo con inicio 7 oct y Glaseado → Jacky. Cambia el producto a "Pastel 5 pax" y cierra con clic afuera. | Horneado y Decorado conservan empleado y fechas. La fila Glaseado desaparece y aparece Embetunado vacío. Al cerrar no se crea ningún registro. | Pendiente |

## [3413] Rosaura Avila (`rec3OES0NemnxyyzY`) — ESCRIBEN datos en Producción

| # | Prueba | Expected | Estado |
|---|---|---|---|
| 24 | Abre el detalle de "Pastel 50 pax", haz clic en el círculo "Decorado" y en el mini pop-up pulsa "No". Repite el clic y "No". | Se crea 1 tarea: Decorado, título "[3413] Rosaura Avila · Decorado · 1", asignada 1, completada 0, Pendiente, Origen Manual, ligada al pedido y al elemento, sin empleado ("Sin asignar") y sin fechas. El tracker no cambia (Horneado sigue como actual). La segunda vez no se duplica. | Pendiente |
| 25 | En el mismo elemento haz clic en "Decorado" y pulsa "Sí". Cierra el detalle y mira el pop-up del pedido sin reabrirlo. | Se crean Horneado y Embetunado como Terminado 1/1 y Decorado pasa a Terminado 1/1. El tracker muestra 3 palomitas y Empacado como actual. El pop-up del pedido debe mostrar las 3 tareas y la línea de etapa actualizada sin reabrirse (hoy falla: sigue con datos viejos). | Pendiente |
| 26 | Abre el detalle de "Cupcakes", haz clic en "Empacado" y pulsa "Sí". | Se crean 4 tareas (Horneado, Embetunado, Decorado, Empacado), todas Terminado 1/1 y "Sin asignar". El tracker muestra las 4 palomitas. | Pendiente |
| 27 | En "Agregar elemento" elige "Galletas", Cantidad 2, Horneado → Ale con inicio 6 oct y fin 7 oct, deja lo demás vacío y pulsa "Crear" dos veces seguidas. | Se crea 1 elemento y 4 tareas, todas Pendiente 0/2 y ligadas al elemento y al pedido. Horneado lleva Ale y las fechas; las otras 3 salen "Sin asignar" y sin fechas. No hay duplicados. | Pendiente |
| 28 | Abre la tarea Horneado de la prueba 27 (clic en su fila) y cambia "Fecha de inicio" al 9 oct. Ciérrala y vuelve a abrirla. | Aparece "Cambios guardados" y, al reabrir, la fecha de inicio es el 9 oct. | Pendiente |

Limpieza después de las pruebas 24 a 28: borra las tareas creadas (icono de basura en el formulario de cada tarea) y luego el elemento de la prueba 27 desde "Editar". Estado final esperado: 0 tareas y 3 elementos en [3413].

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
