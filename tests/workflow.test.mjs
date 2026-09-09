import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('dashboard workflow has safe triggers and minimum permissions', async () => {
  const workflow = await readFile(
    '.github/workflows/update-profile-dashboard.yml',
    'utf8',
  );

  assert.match(workflow, /^\s*schedule:/m);
  assert.match(workflow, /^\s*workflow_dispatch:/m);
  assert.match(workflow, /^\s*contents: write/m);
  assert.match(workflow, /node-version: ['"]?20['"]?/);
  assert.match(workflow, /actions\/checkout@v5/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /node scripts\/generate-dashboard\.mjs/);
  assert.match(workflow, /GITHUB_TOKEN:/);
  assert.match(workflow, /git diff --quiet -- README\.md assets\/github-dashboard\.svg/);
  assert.match(workflow, /git add README\.md assets\/github-dashboard\.svg/);
  assert.doesNotMatch(workflow, /^\s*(push|pull_request):/m);
});
