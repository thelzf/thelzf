import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { renderDashboard } from '../scripts/dashboard/render-dashboard.mjs';

test('renders escaped deterministic dashboard data', async () => {
  const data = JSON.parse(
    await readFile(new URL('./fixtures/dashboard-data.json', import.meta.url)),
  );

  const first = renderDashboard(data);
  const second = renderDashboard(data);

  assert.equal(first, second);
  assert.match(first, /Luiz &amp; Felipe/);
  assert.match(first, /REPOSITÓRIOS/);
  assert.match(first, /COMMITS EM 2026/);
  assert.match(first, /TypeScript/);
  assert.match(first, /50\.0%/);

  for (const color of [
    '#0d1829',
    '#0c2d6b',
    '#0754b8',
    '#1684ff',
    '#54c7ff',
  ]) {
    assert.match(first, new RegExp(color));
  }

  assert.doesNotMatch(first, /ghp_never_render_this/);
});
