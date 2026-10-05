import { CHANGELOG } from './changelog';

export const APP_VERSION = CHANGELOG[0]!.version;
export const APP_DATE = CHANGELOG[0]!.date;

export function buildReadme(): string {
  const history = CHANGELOG.map((c) => `### v${c.version} — ${c.date}\n${c.changes.map((x) => `- ${x}`).join('\n')}`).join('\n\n');
  return `# Amaranta Cakes

Versión ${APP_VERSION} — ${APP_DATE}

Sistema de gestión para la pastelería Amaranta Cakes. Interfaz en React con datos en una base de Airtable.

## Secciones
- **Pedidos:** calendario de pedidos, cake toppers y recibos.
- **Producción:** tareas del día por empleado y avance de las galletas.
- **Finanzas:** cobros, saldos por cobrar y nómina de cada semana.

## Estructura del código
- \`index.tsx\`: entrada de la app, rutas y página de Pedidos.
- \`components/\`: componentes compartidos (menú, calendario, modales, tema, descarga).
- \`produccion/\`: página de Producción.
- \`finanzas/\`: página de Finanzas.
- \`lib/\`: acceso a Airtable, changelog, README y utilidades de descarga.
- \`scripts/gen-source.mjs\`: regenera la copia del código usada por el botón de descarga.

## Descargas
El botón de descarga ofrece: source.pdf, source.zip, readme.pdf y readme.md.

## Mantenimiento
Con cada actualización: agregar una entrada en \`lib/changelog.ts\` (versión y fecha) y ejecutar \`node scripts/gen-source.mjs\`.

## Historial de versiones
${history}
`;
}
