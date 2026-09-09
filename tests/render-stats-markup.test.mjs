import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  injectStatsMarkup,
  renderStatsMarkup,
} from '../scripts/dashboard/render-stats-markup.mjs';

test('renders metrics and languages as real Markdown text', async () => {
  const data = JSON.parse(
    await readFile(new URL('./fixtures/dashboard-data.json', import.meta.url)),
  );
  const markup = renderStatsMarkup(data);

  assert.match(markup, /<strong>52<\/strong><br>Repositórios/);
  assert.match(markup, /<strong>124<\/strong><br>Commits em 2026/);
  assert.match(markup, /TypeScript — 50\.0%/);
  assert.match(markup, /██████████░░░░░░░░░░/);
  assert.match(markup, /Luiz &amp; Felipe/);
  assert.doesNotMatch(markup, /<svg|<img/);
});

test('replaces only content between stats markers', () => {
  const readme = 'before\n<!-- github-stats:start -->\nold\n<!-- github-stats:end -->\nafter\n';
  const updated = injectStatsMarkup(readme, 'new');

  assert.equal(
    updated,
    'before\n<!-- github-stats:start -->\nnew\n<!-- github-stats:end -->\nafter\n',
  );
});
