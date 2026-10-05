/** Version history of the app. Add a new entry (newest first) with every update; the README is built from it. */
export interface ChangelogEntry { version: string; date: string; changes: string[] }
export const CHANGELOG: ChangelogEntry[] = [
  { version: '1.5.0', date: '2026-10-05', changes: [
    'Detalle del elemento: datos, seguimiento de etapas con confirmación "¿Completar tarea?" y tabla de sus tareas.',
    'Detalle del pedido: tabla de tareas con columna "Elemento" y la etapa actual del elemento más atrasado.',
    'Formulario de tarea: empleado opcional y fechas limitadas por la creación de la tarea y la entrega a producción.',
    'Nuevo elemento: tabla "Tareas de producción" por etapa según el tipo de producto.',
    'Producción: buscador por empleado; se ocultó el cálculo de capacidad y el modal de Capacidades.',
  ] },
  { version: '1.4.0', date: '2026-10-04', changes: [
    'Actualización automática de datos cada 30 segundos y al volver a la pestaña; se pausa mientras hay un formulario abierto o un campo en edición.',
  ] },
  { version: '1.3.1', date: '2026-10-04', changes: [
    'Finanzas: botón para actualizar los datos (cobros y nómina) en la barra superior.',
  ] },
  { version: '1.3.0', date: '2026-10-03', changes: [
    'Etapas por tipo de producto: Pastel y Plancha de cupcakes (Horneado, Embetunado, Decorado, Empacado) y Galletas (Horneado, Glaseado, Decorado, Empacado).',
    'La etapa "Empaque" ahora se llama "Empacado"; nueva etapa "Embetunado".',
  ] },
  { version: '1.2.0', date: '2026-10-03', changes: [
    'El menú de descarga permanece abierto hasta hacer clic afuera.',
    'El botón de descarga solo se muestra a usuarios autorizados.',
  ] },
  { version: '1.1.0', date: '2026-10-03', changes: [
    'Botón de descarga (código en PDF/ZIP y README en PDF/MD) en la página principal y en el menú.',
    'Se restauraron las dependencias de íconos y navegación tras volver a una versión anterior.',
  ] },
  { version: '1.0.0', date: '2026-10-02', changes: [
    'Versión inicial: Pedidos (calendario, cake toppers, recibos), Producción (tareas por empleado, avance de galletas) y Finanzas (cobros, saldos, nómina).',
  ] },
];
