import { SOURCE_FILES } from './sourceBundle';
import { buildReadme, APP_VERSION } from './readme';

function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadReadmeMd(): void {
  saveBlob(new Blob([buildReadme()], { type: 'text/markdown;charset=utf-8' }), 'readme.md');
}

export async function downloadSourceZip(): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const [p, c] of Object.entries(SOURCE_FILES)) zip.file(p, c);
  zip.file('README.md', buildReadme());
  saveBlob(await zip.generateAsync({ type: 'blob' }), 'source.zip');
}

type Block = { text: string; bold?: boolean; size?: number; mono?: boolean };

async function writePdf(blocks: Block[], name: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const m = 14; let y = m;
  for (const b of blocks) {
    const size = b.size ?? 10;
    doc.setFont(b.mono ? 'courier' : 'helvetica', b.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lh = size * 0.45;
    // Expand tabs; replace characters outside Latin-1 that built-in fonts cannot draw.
    const clean = b.text.replace(/\t/g, '  ').replace(/[^\x00-\xFF]/g, '?');
    for (const line of doc.splitTextToSize(clean, W - 2 * m) as string[]) {
      if (y + lh > H - m) { doc.addPage(); y = m; }
      doc.text(line, m, y + lh * 0.8);
      y += lh;
    }
    y += 1.5;
  }
  doc.save(name);
}

export async function downloadReadmePdf(): Promise<void> {
  const blocks: Block[] = buildReadme().split('\n').map((l) => {
    if (l.startsWith('# ')) return { text: l.slice(2), bold: true, size: 20 };
    if (l.startsWith('## ')) return { text: l.slice(3), bold: true, size: 14 };
    if (l.startsWith('### ')) return { text: l.slice(4), bold: true, size: 11 };
    return { text: l.replace(/\*\*|`/g, '').replace(/^- /, '• ').replace(/•/g, '-') };
  });
  await writePdf(blocks, 'readme.pdf');
}

export async function downloadSourcePdf(): Promise<void> {
  const blocks: Block[] = [
    { text: `Amaranta Cakes - código fuente v${APP_VERSION}`, bold: true, size: 16 },
    ...Object.entries(SOURCE_FILES).flatMap(([p, c]): Block[] => [
      { text: p, bold: true, size: 11 },
      ...c.split('\n').map((l) => ({ text: l || ' ', mono: true, size: 6.5 })),
    ]),
  ];
  await writePdf(blocks, 'source.pdf');
}
