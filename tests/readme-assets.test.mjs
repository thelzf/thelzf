import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('README uses repository-owned custom dashboard assets', async () => {
  const readme = await readFile('README.md', 'utf8');
  await access('assets/profile-hero.png');
  await access('assets/github-dashboard.svg');

  const start = readme.indexOf('<!-- github-dashboard:start -->');
  const end = readme.indexOf('<!-- github-dashboard:end -->');
  const gadget = readme.slice(start, end);

  assert.ok(start === 0, 'the dashboard must start at the top of the README');
  assert.ok(end > start, 'the dashboard end marker must follow its start marker');
  assert.match(gadget, /assets\/profile-hero\.png/);
  assert.match(gadget, /assets\/github-dashboard\.svg/);
  assert.doesNotMatch(gadget, /vercel\.app|shields\.io|demolab\.com/);
});
