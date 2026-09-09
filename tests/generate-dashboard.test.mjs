import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);

test('CLI generates three deterministic SVG gadgets from the same fixture', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'thelzf-dashboard-'));
  const statsPath = join(directory, 'stats.svg');
  const languagesPath = join(directory, 'languages.svg');
  const contributionsPath = join(directory, 'contributions.svg');
  const env = {
    ...process.env,
    DASHBOARD_DATA_FILE: 'tests/fixtures/dashboard-data.json',
    DASHBOARD_STATS_OUTPUT: statsPath,
    DASHBOARD_LANGUAGES_OUTPUT: languagesPath,
    DASHBOARD_CONTRIBUTIONS_OUTPUT: contributionsPath,
  };

  await execFileAsync('node', ['scripts/generate-dashboard.mjs'], { env });
  const first = await Promise.all(
    [statsPath, languagesPath, contributionsPath].map((path) => readFile(path, 'utf8')),
  );
  await execFileAsync('node', ['scripts/generate-dashboard.mjs'], { env });
  const second = await Promise.all(
    [statsPath, languagesPath, contributionsPath].map((path) => readFile(path, 'utf8')),
  );

  assert.deepEqual(first, second);
  assert.match(first[0], /REPOSITÓRIOS/);
  assert.match(first[1], /TypeScript/);
  assert.match(first[2], /CONTRIBUIÇÕES \/ 2026/);
});
