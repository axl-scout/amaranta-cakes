import React from 'react';

export interface ReceiptElemento {
  cantidad: string;
  titulo: string;
  descripcion: string;
  pan: string;
  relleno: string;
  total: string;
}

export interface ReceiptData {
  pedidoId: string;
  cliente: string;
  nota: string;
  telefono: string;
  redSocial: string;
  fecha: string;
  hora: string;
  elementos: ReceiptElemento[];
  total: string;
  anticipo: string;
  liquidado: string;
  restante: string;
  estatus: string;
  cakeTopper: string;
}

export type ReceiptVariant = 'nota' | 'recibo';

const BRAND = 'Amaranta Cakes';
const TAGLINE = 'Repostería | Pasteles | Cursos';
const SIGNER = 'Jaquelin de León';
const SIGNER_TITLE = "Chef Amaranta Cake's";
const PHONE = '844 498 7115';
const EMAIL = 'amarantacake2020@gmail.com';
const PINK = '#F6C4D2';
const PINK_SOFT = '#FDF2F5';
const INK = '#2E2A2B';
const MUTE = '#9A9296';
const LINE = '#EADFE2';

function redSocialStyle(v: string): { bg: string; color: string } {
  const l = (v || '').toLowerCase();
  if (l === 'whatsapp') return { bg: '#E7F6EC', color: '#1F7A44' };
  if (l === 'facebook') return { bg: '#E8F0FE', color: '#1B4F9B' };
  if (l === 'instagram') return { bg: '#FCE9F2', color: '#B23A82' };
  return { bg: '#F2EEF0', color: '#6B6266' };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: `1px solid ${LINE}`, paddingBottom: 6 }}>
        <span style={{ fontSize: 13, color: MUTE, whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 15, color: INK, fontWeight: 500 }}>{children}</span>
      </div>
    </div>
  );
}

function estatusStyle(v: string): { bg: string; color: string } {
  if (v === 'Entregado') return { bg: '#E7F6EC', color: '#1F7A44' };
  if (v === 'Pendiente') return { bg: '#FCE9EE', color: '#B23A5B' };
  return { bg: '#F2EEF0', color: '#6B6266' };
}

export const ReceiptDocument = React.forwardRef<HTMLDivElement, { data: ReceiptData; variant?: ReceiptVariant }>(({ data, variant = 'nota' }, ref) => {
  const rs = redSocialStyle(data.redSocial);
  const es = estatusStyle(data.estatus);
  const isRecibo = variant === 'recibo';
  const totalsRows: Array<{ label: string; value: string; strong?: boolean }> = isRecibo
    ? [{ label: 'Total', value: data.total }, { label: 'Anticipo', value: data.anticipo }, { label: 'Liquidado', value: data.liquidado }, { label: 'Restante', value: data.restante, strong: true }]
    : [{ label: 'Total', value: data.total }, { label: 'Anticipo', value: data.anticipo }, { label: 'Restante', value: data.restante, strong: true }];
  return (
    <div ref={ref} style={{ width: 794, minHeight: 1123, background: '#FFFFFF', color: INK, fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", padding: 48, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* Header card */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', border: `1px solid ${LINE}`, borderRadius: 18, padding: 24 }}>
        <img src="./assets/271066315-404746088099169-6284592725325573284-n-1-1.jpg" alt={`${BRAND} — ${TAGLINE}`}
          crossOrigin="anonymous" style={{ height: 104, width: 'auto', objectFit: 'contain', display: 'block' }} />
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 16px', minWidth: 230 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 18, padding: '6px 0', borderBottom: `1px solid ${LINE}` }}>
            <span style={{ fontSize: 12, color: MUTE }}>Fecha:</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{data.fecha}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 18, padding: '6px 0' }}>
            <span style={{ fontSize: 12, color: MUTE }}>Hora:</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{data.hora}</span>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div style={{ marginTop: 30 }}>
        <div style={{ fontSize: 12, textTransform: 'none', color: MUTE, marginBottom: 16 }}>{isRecibo ? 'Recibo para' : 'Cotización para'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 40, rowGap: 18 }}>
          <Field label="Cliente:">{data.cliente || '—'}</Field>
          <Field label="Nota:">{data.nota ? `#${data.nota}` : '—'}</Field>
          <Field label="Teléfono:">{data.telefono || '—'}</Field>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: `1px solid ${LINE}`, paddingBottom: 6 }}>
            <span style={{ fontSize: 13, color: MUTE, whiteSpace: 'nowrap' }}>Red social:</span>
            {data.redSocial
              ? <span style={{ fontSize: 13, fontWeight: 600, background: rs.bg, color: rs.color, borderRadius: 999, padding: '2px 12px' }}>{data.redSocial}</span>
              : <span style={{ fontSize: 15, color: INK }}>—</span>}
          </div>
        </div>
        {isRecibo && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 18, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: MUTE }}>Estatus:</span>
              <span style={{ fontSize: 13, fontWeight: 600, background: es.bg, color: es.color, borderRadius: 999, padding: '2px 12px' }}>{data.estatus || 'Sin estatus'}</span>
            </div>
            {data.cakeTopper ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: MUTE }}>Cake Topper:</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: INK }}>{data.cakeTopper}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Items table */}
      <div style={{ marginTop: 30, border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: PINK_SOFT }}>
              {['Cantidad', 'Descripción', 'Pan', 'Relleno', 'Total'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? 'center' : i === 4 ? 'right' : 'left', fontSize: 11, textTransform: 'none', color: MUTE, fontWeight: 700, padding: '12px 16px', borderBottom: `1px solid ${LINE}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.elementos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: MUTE, fontSize: 13 }}>Sin elementos.</td></tr>
            ) : data.elementos.map((el, idx) => (
              <tr key={idx} style={{ borderBottom: idx === data.elementos.length - 1 ? 'none' : `1px solid ${LINE}` }}>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 16, fontWeight: 600, color: INK, verticalAlign: 'top' }}>{el.cantidad || '—'}</td>
                <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{el.titulo || '—'}</div>
                  {el.descripcion ? <div style={{ fontSize: 13, color: MUTE, marginTop: 3 }}>{el.descripcion}</div> : null}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 14, color: '#5B5357', verticalAlign: 'top' }}>{el.pan || '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: 14, color: '#5B5357', verticalAlign: 'top' }}>{el.relleno || '—'}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 15, fontWeight: 600, color: INK, verticalAlign: 'top' }}>{el.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <div style={{ width: 320, border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
          {totalsRows.map((row, i) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'stretch', borderBottom: i === totalsRows.length - 1 ? 'none' : `1px solid ${LINE}` }}>
              <div style={{ width: 130, padding: '12px 16px', background: PINK_SOFT, fontSize: 11, textTransform: 'none', color: MUTE, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{row.label}</div>
              <div style={{ flex: 1, padding: '12px 16px', textAlign: 'right', fontSize: row.strong ? 18 : 16, fontWeight: 700, color: row.strong ? '#B23A82' : INK }}>{row.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Términos */}
      <div style={{ marginTop: 'auto', paddingTop: 34 }}>
        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>Términos</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5B5357' }}>Se requiere 50% de anticipo para cualquier pedido a realizar y con 1 semana de anticipación.</div>
          <div style={{ fontSize: 13, color: MUTE, marginTop: 4 }}>El pago final se realiza al terminar y entregar el producto.</div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{SIGNER}</div>
            <div style={{ fontSize: 13, color: MUTE }}>{SIGNER_TITLE}</div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: PINK, borderRadius: 10, padding: '14px 22px', marginTop: 22 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#7A2F4E' }}>{PHONE}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#7A2F4E' }}>{EMAIL}</span>
      </div>
    </div>
  );
});

ReceiptDocument.displayName = 'ReceiptDocument';
