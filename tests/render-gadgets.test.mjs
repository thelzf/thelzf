import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { renderLanguagesSvg } from '../scripts/dashboard/render-languages-svg.mjs';
import { renderStatsSvg } from '../scripts/dashboard/render-stats-svg.mjs';

const data = JSON.parse(
  await readFile(new URL('./fixtures/dashboard-data.json', import.meta.url)),
);

test('renders profile metrics in a standalone SVG gadget', () => {
  const svg = renderStatsSvg(data);

  assert.match(svg, /width="1200" height="270"/);
  assert.match(svg, /REPOSITÓRIOS/);
  assert.match(svg, /FOLLOWERS/);
  assert.match(svg, /STARS/);
  assert.match(svg, /COMMITS EM 2026/);
  assert.match(svg, /CONTRIBUIÇÕES EM 2026/);
  assert.match(svg, />52<\/text>/);
  assert.match(svg, /Luiz &amp; Felipe/);
  assert.doesNotMatch(svg, /TypeScript|ghp_never_render_this/);
});

test('renders language percentages in a standalone SVG gadget', () => {
  const svg = renderLanguagesSvg(data);

  assert.match(svg, /width="1200" height="390"/);
  assert.match(svg, /LINGUAGENS MAIS USADAS/);
  assert.match(svg, /TypeScript/);
  assert.match(svg, /50\.0%/);
  assert.match(svg, /PHP/);
  assert.match(svg, /#3178c6/);
  assert.doesNotMatch(svg, /REPOSITÓRIOS|ghp_never_render_this/);
});
