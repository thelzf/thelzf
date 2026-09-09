import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);

test('CLI generates identical SVG files from the same fixture', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'thelzf-dashboard-'));
  const firstPath = join(directory, 'first.svg');
  const secondPath = join(directory, 'second.svg');
  const env = {
    ...process.env,
    DASHBOARD_DATA_FILE: 'tests/fixtures/dashboard-data.json',
  };

  await execFileAsync('node', ['scripts/generate-dashboard.mjs'], {
    env: { ...env, DASHBOARD_OUTPUT: firstPath },
  });
  await execFileAsync('node', ['scripts/generate-dashboard.mjs'], {
    env: { ...env, DASHBOARD_OUTPUT: secondPath },
  });

  assert.equal(await readFile(firstPath, 'utf8'), await readFile(secondPath, 'utf8'));
});
