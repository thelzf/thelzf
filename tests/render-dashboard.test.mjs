import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { renderDashboard } from '../scripts/dashboard/render-dashboard.mjs';

test('renders only the visual contribution calendar', async () => {
  const data = JSON.parse(
    await readFile(new URL('./fixtures/dashboard-data.json', import.meta.url)),
  );

  const svg = renderDashboard(data);

  assert.match(svg, /height="300"/);
  assert.match(svg, /CONTRIBUIÇÕES \/ 2026/);
  assert.match(svg, /Luiz &amp; Felipe/);
  assert.doesNotMatch(svg, /REPOSITÓRIOS|TypeScript|ghp_never_render_this/);

  for (const color of [
    '#0d1829',
    '#0c2d6b',
    '#0754b8',
    '#1684ff',
    '#54c7ff',
  ]) {
    assert.match(svg, new RegExp(color));
  }
});
