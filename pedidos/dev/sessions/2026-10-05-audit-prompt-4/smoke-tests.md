# Smoke tests — Prompt 4/4 (vista Todos, tablero y selector de periodo)

Export a probar: v1.10.0 (2026-10-05). Base: Producción (`appSQk87nF0WpH2gi`). Hoy: lunes 5 oct 2026. Set de records: `pedidos/dev/test-records.md` (no se crean datos extra, salvo la prueba 13 con autorización).

Pendientes
1. Confirmar que Claude puede correr la prueba 13 (escribe datos) en [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`): se completa Horneado del Pastel 20 pax desde la app (crea 1 tarea Terminado, Origen Manual) y Claude la borra al final. Sin tu confirmación no se corre.
2. Decidir las reglas de la columna y de la búsqueda de Entregados (ver reporte de auditoría, pendientes 1 y 2) antes de dar por buenas las pruebas 6 y 4b.

Reglas
- Filtro de estatus (junto al buscador): viene en "Pendiente". Para las pruebas de Entregado, ábrelo y marca "Entregado".
- "Selector de periodo" = botón con flecha a la derecha de la barra (muestra Día / Semana / Mes / Todos). "Tablero" = 4 columnas Horneado, Embetunado / Glaseado, Decorado, Empacado.
- Cada tarjeta es un elemento; el color es el del semáforo del elemento y lleva el chip de etapa.
- Sin tareas, todos los elementos con etapas caen en Horneado (las tareas de arranque se borraron).
- No se ejecutan pruebas de tema claro/oscuro (decisión vigente).

## Pruebas por vista

### Selector (sin record)
| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 1 | Selector, escritorio | Página Pedidos > selector de periodo. Pasa el cursor; elige "Semana"; vuelve a pasar el cursor; clic en el selector; con Tab enfoca el selector, ↓ ↑ Enter y Escape. | Muestra solo la opción elegida con flecha, misma altura que el buscador (40 px). Al pasar el cursor despliega Día, Semana, Mes, Todos y se cierra al elegir. Con teclado: ↓/↑ mueven, Enter elige, Escape cierra. Nota: si ya está abierto por el hover, el clic lo cierra. | |
| 2 | Selector, celular | Página Pedidos en celular (o emulación táctil) > toca el selector > toca "Todos"; vuelve a abrir y toca fuera. | Abre con un toque (sin hover), cierra al elegir o al tocar fuera. | |
| 3 | Controles de fecha | Selector > "Todos". Luego "Día". | En "Todos" no hay flechas, selector de fecha ni "Hoy"; el buscador y el filtro de estatus siguen. En "Día" reaparecen. | |

### Vista Todos
Record de la prueba 4: este record es el que vas a utilizar para esta prueba: [4128] Sara (`recZCPIvYm7J76UX1`, 1 oct), [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`, 8 oct), [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`, 14 oct) y [3413] Rosaura Avila (`rec3OES0NemnxyyzY`, 15 oct).

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 4 | Columnas, tarjetas, orden y conteo | Selector > "Todos", filtro "Pendiente". Cuenta las tarjetas de cada columna y compara con el número del encabezado. Ubica las de los 4 records. | 4 columnas con ese orden de encabezados. Una tarjeta por elemento: [4128] 1, [3210] 2 (Pastel 20 pax y Cupcakes), [4161] 1, [3413] 3 (Pastel 50 pax, Cupcakes, Galletas), todas en Horneado y con chip "No iniciado" (morado). Orden en la columna: [4128], [3210], [4161], [3413]. Cada tarjeta muestra ID, elemento × cantidad, fecha de producción y chip. Cada encabezado muestra el conteo real. Clic en una tarjeta abre el pop-up del pedido. | |
| 5 | Entregados ausentes | Filtro de estatus: marca "Pendiente" y "Entregado". Sin escribir en el buscador, revisa las 4 columnas. Records: [4180] Elizabeth martinez (`recDcAiYcYQINykVw`), [4160] Alice (`rec2FnINtW50a2LFW`), [4148] Blanca Valdes (`recVNjMyWhvzgnU5t`). | Ninguno de los tres aparece en el tablero. | |
| 6 | Entregado al buscar | Mismo filtro (Pendiente + Entregado). Escribe "Elizabeth", luego "Alice"; borra el texto. Repite con solo "Pendiente" y "Elizabeth". Records: [4180] (Pastel 20 pax) y [4160] (Galletas). | Con la búsqueda aparece la tarjeta en Empacado, verde, chip "Entregado"; al borrar desaparece. Con solo "Pendiente": el prompt pide que también aparezca; hoy no aparece (hallazgo FAIL, pendiente 1 del reporte). | |
| 7 | Productos sin etapas | Filtro Pendiente + Entregado. Busca "Gisela" y luego "Jarumi". Records: [4014] Gisela torres (`recL9IQjl1g5PGmRo`, elemento sin producto) y [3838] Jarumi (`recNX2aMYAzAYGygg`, sin elementos). | Ambos salen en la lista del buscador, pero el tablero no muestra tarjetas para ellos. | |
| 8 | Esqueletos de carga | Selector > "Todos" y recarga la página (idealmente con la red lenta). | Mientras carga se ven esqueletos de las 4 columnas. Hallazgo: primero se ve el esqueleto de la tabla de Día (PARTIAL). | |
| 9 | Tablero en celular | Celular > "Todos" > desliza a los lados. | Una columna casi a todo el ancho con ajuste por columna. | |

### Vista Día
Record: este record es el que vas a utilizar para esta prueba: [4128] Sara (`recZCPIvYm7J76UX1`), abre el 1 oct 2026; luego [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`), abre el 14 oct 2026.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 10 | Lista / Tablero | Selector > "Día" > fecha 1 oct 2026 > botón "Lista"/"Tablero" (junto al selector). Cambia a Tablero. Cambia la fecha al 14 oct. Vuelve a Lista. | Por defecto "Lista". En Tablero solo hay tarjetas de pedidos de ese día: el 1 oct incluye [4128] en Horneado; el 14 oct, [4161] en Horneado; ninguna de otros días. El criterio de fecha es el mismo de la lista. | |
| 11 | Persistencia | Deja Día + Tablero, recarga. Cambia a Todos, recarga. | Tras recargar abre en Día + Tablero; con Todos abre en Todos. | |

### Semana y Mes (regresión)
Record: este record es el que vas a utilizar para esta prueba: [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), abre el 8 oct 2026; y [3413] Rosaura Avila el 15 oct 2026.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 12 | Semana y Mes sin cambios | Selector > "Semana" (semana del 5 oct) y "Mes" (octubre), filtro Pendiente. | Tarjetas con nombre de etapa y fondo suave, igual que en v1.9.2; flechas y selector de fecha funcionan. | |

### Escritura (corre solo tras tu confirmación, pendiente 1)
Record: este record es el que vas a utilizar para esta prueba: [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), abre el 8 oct 2026. Escribe datos: crea 1 tarea (Horneado, Terminado) y Claude la borra al final.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 13 | Dos elementos en etapas distintas; actualización sin recargar | Abre "Todos" en una pestaña y deja visible. En Pedidos abre [3210] > fila Pastel 20 pax (detalle del elemento) > seguimiento de etapas > "Horneado" > "¿Completar tarea?" > "Sí". Regresa al tablero sin recargar. | [3210] aparece 2 veces: Pastel 20 pax en Embetunado / Glaseado (chip "Horneado listo", rojo) y Cupcakes en Horneado ("No iniciado", morado). El cambio ocurre sin recargar y ninguna tarjeta ni chip queda vacío. | |

### Transversales
| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|
| 14 | Sin vacíos al refrescar | En "Todos" con tarjetas visibles, cambia de pestaña y regresa, y espera 30 s. | Las tarjetas y conteos no desaparecen ni parpadean a vacío. | |
| 15 | Sin escrituras | Claude, al terminar: lista `tareas_produccion` y esquema. | 14 tareas (o las mismas que antes de la prueba 13), esquema sin cambios. | |

## Cerradas
(ninguna)
