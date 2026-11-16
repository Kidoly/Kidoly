/**
 * Builds the static SVG cards in assets/ for README.md, in the albanmary.com style.
 *
 *   npm run build
 *
 * Content comes from scripts/content.mjs. The live cards (hero, activity, latest post)
 * are served by albanmary.com/github/*.svg and refreshed every 5 minutes.
 * satori lays the cards out and turns every glyph into a path: GitHub shows SVGs
 * through <img>, where web fonts never load.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import satori from 'satori';
import * as icons from 'simple-icons';
import * as content from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');
const W = 1000;

// The site's dark tokens, in sRGB (satori does not parse oklch()).
const C = {
  bg: '#0e100f',
  panel: '#161917',
  panel2: '#131614',
  rule: '#232825',
  rule2: '#2c322e',
  text: '#e4e7e4',
  text2: '#9aa19c',
  dim: '#7d8580',
  accent: '#d73626',
  accentOnDark: '#ea4f3b',
  ok: '#6de18b',
  // Heatmap: no contributions, then the accent at rising strength
  heat: ['#1b1f1d', '#4a1f19', '#7a2a1f', '#a83024', '#d73626'],
};

// --- Fonts and text measurement ---------------------------------------------------------

const fontFile = (name) => readFile(join(ROOT, 'fonts', name));
const [archivo500, archivo800, mono] = await Promise.all([
  fontFile('Archivo-500.woff'),
  fontFile('Archivo-800.woff'),
  fontFile('JetBrainsMono-400.woff'),
]);
const FONTS = [
  { name: 'Archivo', data: archivo500, weight: 500, style: 'normal' },
  { name: 'Archivo', data: archivo800, weight: 800, style: 'normal' },
  { name: 'JetBrains Mono', data: mono, weight: 400, style: 'normal' },
];
const METRICS = { sans: fontkit.create(archivo500), bold: fontkit.create(archivo800), mono: fontkit.create(mono) };

/** Advance width of `text` in px, as satori will lay it out. */
function measure(text, font, size, letterSpacing = 0) {
  const f = METRICS[font];
  return (f.layout(text).advanceWidth / f.unitsPerEm) * size + letterSpacing * text.length;
}

// --- Element helpers --------------------------------------------------------------------

/** satori element; children may be strings, elements, arrays, or falsy (skipped). */
function h(type, style = {}, ...children) {
  const kids = children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false);
  return { type, props: { style, children: kids.length === 1 ? kids[0] : kids } };
}
const div = (style, ...children) => h('div', { display: 'flex', boxSizing: 'border-box', ...style }, ...children);
const monoText = (style, text) => div({ fontFamily: 'JetBrains Mono', fontSize: 13, color: C.dim, ...style }, text);

async function render(name, node, width, height) {
  const svg = await satori(node, { width, height, fonts: FONTS });
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${name}.svg`), svg);
  console.log(`  ${name}.svg  ${width}×${Math.round(height)}`);
}

/** Root of a card: the site's dark panel with a 1px rule, square corners. */
const card = (style, ...children) =>
  div(
    { width: '100%', height: '100%', background: C.bg, border: `1px solid ${C.rule}`, color: C.text, fontFamily: 'Archivo', ...style },
    ...children
  );

const ICON_SIZE = 16;

/** simple-icons logo in its brand colour (lightened when too dark for the panel), or a monogram. */
function icon(slug, label, size = ICON_SIZE, colour) {
  const si = slug && icons[`si${slug[0].toUpperCase()}${slug.slice(1)}`];
  if (si) {
    const fill = colour ?? (luminance(si.hex) < 0.08 ? C.text : `#${si.hex}`);
    return {
      type: 'svg',
      props: {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        children: { type: 'path', props: { d: si.path, fill } },
      },
    };
  }
  const letters = label.replace(/[^A-Za-z]/g, '').slice(0, label === 'LinkedIn' ? 0 : 1) || 'in';
  return div(
    {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${colour ?? C.dim}`,
      fontFamily: 'JetBrains Mono',
      fontSize: Math.round(size * 0.62),
      color: colour ?? C.text2,
      lineHeight: 1,
    },
    letters
  );
}

function luminance(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// --- Cards ------------------------------------------------------------------------------

function band(number, title, desc, path) {
  const height = 92;
  const node = card(
    { alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 40px 20px 36px', borderLeft: `4px solid ${C.accent}` },
    div(
      { alignItems: 'baseline', gap: 16 },
      monoText({ fontSize: 15, color: C.accentOnDark }, `${number} /`),
      div({ fontSize: 44, fontWeight: 800, letterSpacing: -1.6, lineHeight: 1 }, title)
    ),
    div(
      { flexDirection: 'column', alignItems: 'flex-end', gap: 6, maxWidth: 480 },
      monoText({ fontSize: 12 }, path),
      div({ fontSize: 16, fontWeight: 500, color: C.text2, textAlign: 'right' }, desc)
    )
  );
  return [node, W, height];
}

const CHIP = { h: 36, padX: 13, gap: 10, iconGap: 9, font: 15 };

function chipWidth(label) {
  return 2 + 2 * CHIP.padX + ICON_SIZE + CHIP.iconGap + Math.ceil(measure(label, 'sans', CHIP.font));
}

function chip(label, slug) {
  return div(
    {
      height: CHIP.h,
      alignItems: 'center',
      gap: CHIP.iconGap,
      padding: `0 ${CHIP.padX}px`,
      border: `1px solid ${C.rule2}`,
      background: C.panel,
      fontSize: CHIP.font,
      fontWeight: 500,
    },
    icon(slug, label),
    label
  );
}

/** Number of rows `widths` wrap into, the way flex-wrap does. */
function rows(widths, available, gap) {
  let count = 1;
  let x = 0;
  for (const w of widths) {
    if (x > 0 && x + gap + w > available) {
      count++;
      x = w;
    } else {
      x += (x > 0 ? gap : 0) + w;
    }
  }
  return count;
}

function stackRow(area, tools) {
  const LEFT = 250;
  const PAD = 22;
  const available = W - 2 - LEFT - 1 - 2 * PAD;
  const n = rows(tools.map(([label]) => chipWidth(label)), available, CHIP.gap);
  const chipsH = n * CHIP.h + (n - 1) * CHIP.gap;
  const height = Math.max(2 * PAD + chipsH, 112) + 2;
  const node = card(
    {},
    div(
      { width: LEFT, flexShrink: 0, flexDirection: 'column', justifyContent: 'space-between', padding: `${PAD - 2}px 22px`, background: C.panel2, borderRight: `1px solid ${C.rule}` },
      monoText({ fontSize: 12 }, `${String(tools.length).padStart(2, '0')} tools`),
      div({ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15 }, area)
    ),
    div(
      { flexWrap: 'wrap', alignContent: 'center', gap: CHIP.gap, padding: PAD, flexGrow: 1 },
      tools.map(([label, slug]) => chip(label, slug))
    )
  );
  return [node, W, height];
}

function button(label, slug, primary) {
  const height = 44;
  const ICON = 16;
  const width = Math.ceil(2 + 2 * 16 + ICON + 10 + measure(label, 'mono', 14));
  const colour = primary ? '#ffffff' : undefined;
  const node = div(
    {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px',
      background: primary ? C.accent : C.bg,
      border: `1px solid ${primary ? C.accent : C.rule2}`,
      color: primary ? '#ffffff' : C.text,
      fontFamily: 'JetBrains Mono',
      fontSize: 14,
    },
    slug || label === 'LinkedIn'
      ? icon(slug, label, ICON, colour)
      : div({ width: ICON, height: ICON, alignItems: 'center', justifyContent: 'center' }, div({ width: 8, height: 8, borderRadius: 8, background: primary ? '#ffffff' : C.accent })),
    label
  );
  return [node, width, height];
}

// --- Main -------------------------------------------------------------------------------

for (const [name, number, title, desc] of content.BANDS) {
  await render(name, ...band(number, title, desc, `~/${name.replace('band-', '')}`));
}
for (const [name, area, tools] of content.STACK) await render(name, ...stackRow(area, tools));
for (const [name, label, slug, primary] of content.BUTTONS) await render(name, ...button(label, slug, primary));
