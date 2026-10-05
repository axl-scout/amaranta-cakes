# Amaranta Cakes

Versión 1.6.0 — 2026-10-05

Sistema de gestión para la pastelería Amaranta Cakes. Interfaz en React con datos en una base de Airtable.

## Secciones
- **Pedidos:** calendario de pedidos, cake toppers y recibos.
- **Producción:** tareas del día por empleado y avance de las galletas.
- **Finanzas:** cobros, saldos por cobrar y nómina de cada semana.

## Estructura del código
- `index.tsx`: entrada de la app, rutas y página de Pedidos.
- `components/`: componentes compartidos (menú, calendario, modales, tema, descarga).
- `produccion/`: página de Producción.
- `finanzas/`: página de Finanzas.
- `lib/`: acceso a Airtable, changelog, README y utilidades de descarga.
- `scripts/gen-source.mjs`: regenera la copia del código usada por el botón de descarga.

## Descargas
El botón de descarga ofrece: source.pdf, source.zip, readme.pdf y readme.md.

## Mantenimiento
Con cada actualización: agregar una entrada en `lib/changelog.ts` (versión y fecha) y ejecutar `node scripts/gen-source.mjs`.

## Historial de versiones
### v1.6.0 — 2026-10-05
- Producción: buscador de pedidos igual al de Pedidos (con navegación por flechas).
- Producción: el buscador de empleados se reemplazó por un filtro desplegable de empleados.

### v1.5.1 — 2026-10-05
- Buscador de pedidos: el ancho de los resultados es constante y se puede navegar con flechas, Enter y Escape.

### v1.5.0 — 2026-10-05
- Detalle del elemento: datos, seguimiento de etapas con confirmación "¿Completar tarea?" y tabla de sus tareas.
- Detalle del pedido: tabla de tareas con columna "Elemento" y la etapa actual del elemento más atrasado.
- Formulario de tarea: empleado opcional y fechas limitadas por la creación de la tarea y la entrega a producción.
- Nuevo elemento: tabla "Tareas de producción" por etapa según el tipo de producto.
- Producción: buscador por empleado; se ocultó el cálculo de capacidad y el modal de Capacidades.

### v1.4.0 — 2026-10-04
- Actualización automática de datos cada 30 segundos y al volver a la pestaña; se pausa mientras hay un formulario abierto o un campo en edición.

### v1.3.1 — 2026-10-04
- Finanzas: botón para actualizar los datos (cobros y nómina) en la barra superior.

### v1.3.0 — 2026-10-03
- Etapas por tipo de producto: Pastel y Plancha de cupcakes (Horneado, Embetunado, Decorado, Empacado) y Galletas (Horneado, Glaseado, Decorado, Empacado).
- La etapa "Empaque" ahora se llama "Empacado"; nueva etapa "Embetunado".

### v1.2.0 — 2026-10-03
- El menú de descarga permanece abierto hasta hacer clic afuera.
- El botón de descarga solo se muestra a usuarios autorizados.

### v1.1.0 — 2026-10-03
- Botón de descarga (código en PDF/ZIP y README en PDF/MD) en la página principal y en el menú.
- Se restauraron las dependencias de íconos y navegación tras volver a una versión anterior.

### v1.0.0 — 2026-10-02
- Versión inicial: Pedidos (calendario, cake toppers, recibos), Producción (tareas por empleado, avance de galletas) y Finanzas (cobros, saldos, nómina).
