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

test('normalizes the six displayed languages and rounds them to exactly 100 percent', () => {
  const svg = renderLanguagesSvg({
    user: { login: 'thelzf' },
    languages: [
      { name: 'A', color: '#111111', size: 1 },
      { name: 'B', color: '#222222', size: 1 },
      { name: 'C', color: '#333333', size: 1 },
      { name: 'D', color: '#444444', size: 1 },
      { name: 'E', color: '#555555', size: 1 },
      { name: 'F', color: '#666666', size: 1 },
      { name: 'G', color: '#777777', size: 100 },
    ],
  });

  const percentages = [...svg.matchAll(/class="percent">([0-9]+\.[0-9])%<\/text>/g)]
    .map((match) => Number(match[1]));
  assert.equal(percentages.length, 6);
  assert.ok(Math.abs(percentages.reduce((sum, value) => sum + value, 0) - 100) < 0.000001);
  assert.match(svg, /G/);
  assert.match(svg, />G<\/text>[\s\S]*>A<\/text>/);
});

test('renders fewer than six languages without inventing rows', () => {
  const svg = renderLanguagesSvg({
    user: { login: 'thelzf' },
    languages: [{ name: 'PHP', color: '#4F5D95', size: 100 }],
  });

  assert.equal((svg.match(/class="language"/g) || []).length, 1);
  assert.match(svg, /100\.0%/);
});
