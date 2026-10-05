# Smoke tests — Prompt 4/4 (vista Todos, tablero y selector de periodo)

Export a probar: v1.10.0 (2026-10-05). Base: Producción (`appSQk87nF0WpH2gi`). Hoy: lunes 5 oct 2026. Set de records: `pedidos/dev/test-records.md` (no se crean datos extra, salvo la prueba 13 con autorización).

Pendientes
1. Corre la prueba 13 (escribe datos, autorizada) y avísame para borrar la tarea que cree en [3210] (`recY1WRFAEYXZhe50`). Falta también reportar la 14.
2. Decidir dos solicitudes nuevas (ver Observaciones de Axel y reporte): búsqueda que filtre Día, Semana y Mes, y menú lateral con hamburguesa en celular.

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
| 1 | Selector, escritorio | Página Pedidos > selector de periodo. Pasa el cursor; elige "Semana"; vuelve a pasar el cursor; clic en el selector; con Tab enfoca el selector, ↓ ↑ Enter y Escape. | Muestra solo la opción elegida con flecha, misma altura que el buscador (40 px). Al pasar el cursor despliega Día, Semana, Mes, Todos y se cierra al elegir. Con teclado: ↓/↑ mueven, Enter elige, Escape cierra. Nota: si ya está abierto por el hover, el clic lo cierra. | FUNCIONA, pero Axel pide cambiar el diseño (ver Observaciones). |

### Vista Todos
Record de la prueba 4: este record es el que vas a utilizar para esta prueba: [4128] Sara (`recZCPIvYm7J76UX1`, 1 oct), [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`, 8 oct), [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`, 14 oct) y [3413] Rosaura Avila (`rec3OES0NemnxyyzY`, 15 oct).

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|

### Vista Día
Record: este record es el que vas a utilizar para esta prueba: [4128] Sara (`recZCPIvYm7J76UX1`), abre el 1 oct 2026; luego [4161] Efrain Dl Angel (`recpD5i15hQsj0PSl`), abre el 14 oct 2026.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|

### Semana y Mes (regresión)
Record: este record es el que vas a utilizar para esta prueba: [3210] Alondra S Dávila (`recY1WRFAEYXZhe50`), abre el 8 oct 2026; y [3413] Rosaura Avila el 15 oct 2026.

| # | Área | Pasos | Resultado esperado | Pass/Fail |
|---|---|---|---|---|

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

## Observaciones de Axel
- Prueba 1: funciona, pero en lugar de un dropdown quiere el interruptor de antes (Día / Semana / Mes + Todos) con un cambio: solo se ve la opción seleccionada dentro de un contenedor; al pasar el cursor el contenedor se expande y muestra el selector completo. Va al prompt de corrección.

## Observaciones de Axel (ronda 3)
- El buscador no filtra la página (Día, Semana, Mes): solo muestra opciones en su desplegable. En Todos sí filtra el tablero.
- En celular, el menú lateral no debería ir al costado; debería usarse la hamburguesa.

## Cerradas
~~6 (resto). Axel confirma que funciona al borrar el texto. El caso con solo "Pendiente" queda cubierto por la decisión 1 del prompt de corrección.~~
~~7. Productos sin etapas: capturas 11 y 12. "gisela" y "jarumi" salen en el buscador; [4014] y [3838] sin tarjeta en el tablero ([3850] Jarumi, otro pedido, sí tiene su tarjeta en Horneado).~~
~~8. Esqueletos de carga: Axel confirma que funciona.~~
~~9. Tablero en celular: captura 13, columnas que se deslizan con la siguiente asomando; funciona.~~
~~10. Día Lista/Tablero: Axel confirma que funciona.~~
~~11. Persistencia: Axel confirma que funciona.~~
~~12. Semana y Mes: capturas 14 y 15 (5-11 oct y octubre, filtro Pendiente), tarjetas con "No iniciado" como en v1.9.2, flechas y selector de fecha funcionan.~~
~~5. Entregados ausentes: capturas 6 a 8 (filtro Pendiente + Entregado). Buscar 4180, 4160 y 4148 con Ctrl+F en el tablero da 0/0; ninguno aparece sin búsqueda.~~
~~6 (parte). Entregado al buscar: capturas 9 y 10 (filtro "2 seleccionados"). "elizabe" muestra 7 tarjetas en Empacado, verdes, con chip "Entregado" (incluye [3746], [3720] ×2, [4178] y pedidos antiguos sin ID como "Elizabeth Serna"); "alice" muestra [4160] Alice, Galletas × 50, 30 sep, Empacado verde "Entregado".~~
~~2. Selector, celular: capturas de Axel (vista Semana en celular, selector de 40 px con la opción elegida).~~
~~3. Controles de fecha: capturas 2 y 3. En "Todos" no hay flechas, fecha ni "Hoy" y el buscador y el filtro siguen; en "Día" reaparecen (más el botón "Lista").~~
~~4. Columnas, tarjetas, orden y conteo (parcial por capturas): Horneado 51, las otras 3 columnas en 0 con "Sin elementos."; orden ascendente por fecha ([3931] 25 ago, [4128] 1 oct, [4132] y [3436] 8 oct, [3210] 2 tarjetas 8 oct 5:00 p.m. Cupcakes ×50 y Pastel 20 pax ×1, [4106] y [4159] 12 oct, [4161] 14 oct, [4143] y [3413] 15 oct); todas "No iniciado" morado. Sin ver aún: las 3 tarjetas de [3413], que el conteo 51 coincida y el clic que abre el pedido.~~
