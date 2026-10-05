import { useEffect, useState } from 'react';

/**
 * Airtable's own select-choice palette (fill + text), for light and dark mode.
 * Values match Airtable's rendering of each choice color name — this is not a custom theme.
 * Choices keep whatever color is configured on the field in Airtable.
 */
const INK = '#1D1F25';
const WHITE = '#FFFFFF';
type Pair = [bg: string, fg: string];
const NEXT: Record<string, string> = { Light2: 'Light1', Light1: 'Bright', Bright: 'Dark1', Dark1: 'Dark1' };
const PALETTE: Record<string, { light: Pair; dark: Pair }> = {
  blueLight2: { light: ['#D1E2FF', INK], dark: ['#2A2D33', '#A0C6FF'] },
  blueLight1: { light: ['#A0C6FF', INK], dark: ['#404F66', '#D1E2FF'] },
  blueBright: { light: ['#166EE1', WHITE], dark: ['#1258B4', '#D1E2FF'] },
  blueDark1: { light: ['#0D52AC', WHITE], dark: ['#052145', '#D1E2FF'] },
  cyanLight2: { light: ['#C4ECFF', INK], dark: ['#272F33', '#88DBFF'] },
  cyanLight1: { light: ['#88DBFF', INK], dark: ['#365866', '#C4ECFF'] },
  cyanBright: { light: ['#39CAFF', INK], dark: ['#2EA2CC', '#000000'] },
  cyanDark1: { light: ['#0F68A2', WHITE], dark: ['#062A41', '#C4ECFF'] },
  tealLight2: { light: ['#C1F5F0', INK], dark: ['#273130', '#74EBE1'] },
  tealLight1: { light: ['#74EBE1', INK], dark: ['#2E5E5A', '#C1F5F0'] },
  tealBright: { light: ['#01DDD5', INK], dark: ['#01B1AA', '#000000'] },
  tealDark1: { light: ['#17726E', WHITE], dark: ['#092E2C', '#C1F5F0'] },
  greenLight2: { light: ['#CFF5D1', INK], dark: ['#29312A', '#9AE095'] },
  greenLight1: { light: ['#9AE095', INK], dark: ['#3E5A3C', '#CFF5D1'] },
  greenBright: { light: ['#048A0E', WHITE], dark: ['#036E0B', '#CFF5D1'] },
  greenDark1: { light: ['#006400', WHITE], dark: ['#002800', '#CFF5D1'] },
  yellowLight2: { light: ['#FFEAB6', INK], dark: ['#332F24', '#FFD66B'] },
  yellowLight1: { light: ['#FFD66B', INK], dark: ['#66562B', '#FFEAB6'] },
  yellowBright: { light: ['#FFBA05', INK], dark: ['#CC9504', '#000000'] },
  yellowDark1: { light: ['#AF6002', WHITE], dark: ['#462601', '#FFEAB6'] },
  orangeLight2: { light: ['#FFE0CC', INK], dark: ['#332D29', '#FFB68E'] },
  orangeLight1: { light: ['#FFB68E', INK], dark: ['#664939', '#FFE0CC'] },
  orangeBright: { light: ['#D54401', WHITE], dark: ['#AA3601', '#FFE0CC'] },
  orangeDark1: { light: ['#AA2D00', WHITE], dark: ['#441200', '#FFE0CC'] },
  redLight2: { light: ['#FFD4E0', INK], dark: ['#332A2D', '#FFA6C1'] },
  redLight1: { light: ['#FFA6C1', INK], dark: ['#66424D', '#FFD4E0'] },
  redBright: { light: ['#DC043B', WHITE], dark: ['#B0032F', '#FFD4E0'] },
  redDark1: { light: ['#B10F41', WHITE], dark: ['#47061A', '#FFD4E0'] },
  pinkLight2: { light: ['#FAD2FC', INK], dark: ['#322A32', '#F797EF'] },
  pinkLight1: { light: ['#F797EF', INK], dark: ['#633C60', '#FAD2FC'] },
  pinkBright: { light: ['#DD04A8', WHITE], dark: ['#B10386', '#FAD2FC'] },
  pinkDark1: { light: ['#AB0A83', WHITE], dark: ['#440434', '#FAD2FC'] },
  purpleLight2: { light: ['#E0DAFD', INK], dark: ['#2D2C33', '#BFAEFC'] },
  purpleLight1: { light: ['#BFAEFC', INK], dark: ['#4C4665', '#E0DAFD'] },
  purpleBright: { light: ['#7C37EF', WHITE], dark: ['#632CBF', '#E0DAFD'] },
  purpleDark1: { light: ['#6231AE', WHITE], dark: ['#271446', '#E0DAFD'] },
  grayLight2: { light: ['#E5E9F0', INK], dark: ['#2E2F30', '#C4C7CD'] },
  grayLight1: { light: ['#C4C7CD', INK], dark: ['#4E5052', '#E5E9F0'] },
  grayBright: { light: ['#616670', WHITE], dark: ['#4E525A', '#E5E9F0'] },
  grayDark1: { light: ['#41454D', WHITE], dark: ['#1A1C1F', '#E5E9F0'] },
};

export function useIsDark(): boolean {
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export type ToneStyle = { backgroundColor: string; color: string; border: string };

/**
 * Inline style for an Airtable choice color name (e.g. "yellowLight2").
 * The border uses the next shade of the same Airtable hue (Light2 → Light1 → Bright → Dark1).
 */
export function choiceStyle(color: string | null | undefined, dark: boolean): ToneStyle | null {
  const p = color ? PALETTE[color] : undefined;
  if (!p) return null;
  const [bg, fg] = dark ? p.dark : p.light;
  const m = color!.match(/^(\w+?)(Light2|Light1|Bright|Dark1)$/);
  const next = m ? PALETTE[m[1] + NEXT[m[2]!]] : undefined;
  const bd = next ? (dark ? next.dark[0] : next.light[0]) : bg;
  return { backgroundColor: bg, color: fg, border: `1px solid ${bd}` };
}

/** App-wide semantic tones taken from the Airtable palette. */
export const TONE = { green: 'greenLight2', red: 'redLight2', amber: 'yellowLight2', gray: 'grayLight2' } as const;
export function toneStyle(tone: keyof typeof TONE, dark: boolean): ToneStyle {
  return choiceStyle(TONE[tone], dark)!;
}

// ── Estatus (pedidos) choice colors, read from the Airtable field configuration ──
let estatusColors: Record<string, string> = {};
export function setEstatusChoices(choices: Array<{ name: string; color?: string }> | undefined | null): void {
  estatusColors = Object.fromEntries((choices ?? []).filter((c) => c.color).map((c) => [c.name, c.color as string]));
}
export function estatusStyle(value: string | null | undefined, dark: boolean) {
  return value ? choiceStyle(estatusColors[value], dark) : null;
}
