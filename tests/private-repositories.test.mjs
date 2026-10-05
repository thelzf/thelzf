import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const querySource = await readFile(new URL('../scripts/dashboard/github-data.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/update-profile-dashboard.yml', import.meta.url), 'utf8');

test('dashboard queries owned repositories without restricting to public ones', () => {
  assert.doesNotMatch(querySource, /privacy:\s*PUBLIC/);
  assert.match(querySource, /ownerAffiliations:\s*OWNER/);
});

test('dashboard workflow uses the private-repository read token secret', () => {
  assert.match(workflow, /GITHUB_TOKEN:\s*\$\{\{\s*secrets\.actions\s*\}\}/);
});
