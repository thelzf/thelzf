# Custom GitHub Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic profile widgets with a unique neon dashboard generated from real GitHub data and display the supplied portrait artwork above it.

**Architecture:** A dependency-free Node.js module obtains normalized profile data either from a fixture or GitHub GraphQL, then renders a deterministic SVG. A scheduled GitHub Actions workflow regenerates and commits the SVG, while the README references only repository-owned assets.

**Tech Stack:** Node.js 20 native APIs, Node test runner, GitHub GraphQL API, SVG, GitHub Actions, Markdown/HTML.

**Spec:** `docs/superpowers/specs/2026-09-09-custom-github-dashboard-design.md`

## Global Constraints

- Use exclusively the official GitHub API as the live data source.
- Add no npm dependencies.
- Label annual commit and contribution values explicitly as current-year values.
- Never write the token into files, logs, or generated SVG.
- Preserve every byte of README content after `<!-- github-dashboard:end -->`.
- Keep the last valid SVG when live data collection fails.
- The workflow triggers only on `schedule` and `workflow_dispatch` and receives only `contents: write` permission.

---

### Task 1: Deterministic SVG renderer

**Files:**
- Create: `scripts/dashboard/render-dashboard.mjs`
- Create: `tests/fixtures/dashboard-data.json`
- Create: `tests/render-dashboard.test.mjs`

**Interfaces:**
- Consumes: normalized `DashboardData` JSON with `user`, `metrics`, `languages`, `calendar`, and `generatedAt` properties.
- Produces: `renderDashboard(data: DashboardData): string` and `escapeXml(value: unknown): string`.

- [ ] **Step 1: Create a fixture and failing renderer test**

Use fixture values including `name: "Luiz & Felipe"`, five metrics, three languages with byte sizes, and two calendar weeks containing contribution levels `NONE` through `FOURTH_QUARTILE`. Assert that the returned SVG contains `Luiz &amp; Felipe`, `REPOSITÓRIOS`, `COMMITS EM 2026`, `TypeScript`, `50.0%`, all five heatmap colors, and does not contain the fixture token string `ghp_never_render_this`.

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderDashboard } from '../scripts/dashboard/render-dashboard.mjs';

test('renders escaped deterministic dashboard data', async () => {
  const data = JSON.parse(await readFile(new URL('./fixtures/dashboard-data.json', import.meta.url)));
  const first = renderDashboard(data);
  const second = renderDashboard(data);
  assert.equal(first, second);
  assert.match(first, /Luiz &amp; Felipe/);
  assert.match(first, /REPOSITÓRIOS/);
  assert.match(first, /COMMITS EM 2026/);
  assert.match(first, /TypeScript/);
  assert.match(first, /50\.0%/);
  for (const color of ['#0d1829', '#0c2d6b', '#0754b8', '#1684ff', '#54c7ff']) assert.match(first, new RegExp(color));
  assert.doesNotMatch(first, /ghp_never_render_this/);
});
```

- [ ] **Step 2: Run the renderer test and verify RED**

Run: `node --test tests/render-dashboard.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `render-dashboard.mjs`.

- [ ] **Step 3: Implement the renderer**

Create `escapeXml`, number formatting, language percentage calculation, metric cards, language bars, and a contribution grid in a 1200×720 SVG. Use a single exported `renderDashboard(data)` function, fixed color tokens, accessible `<title>` and `<desc>`, and no external resources or scripts inside the SVG.

```js
export const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export function renderDashboard(data) {
  const languageTotal = data.languages.reduce((sum, language) => sum + language.size, 0);
  const languages = data.languages.slice(0, 6).map((language) => ({
    ...language,
    percent: languageTotal === 0 ? 0 : (language.size / languageTotal) * 100,
  }));
  return buildSvgDocument(data, languages);
}
```

- [ ] **Step 4: Run the renderer test and verify GREEN**

Run: `node --test tests/render-dashboard.test.mjs`

Expected: `1` test passing and `0` failing.

- [ ] **Step 5: Commit the renderer**

```bash
git add scripts/dashboard/render-dashboard.mjs tests/fixtures/dashboard-data.json tests/render-dashboard.test.mjs
git commit -m "Add custom profile dashboard renderer"
```

### Task 2: GitHub data collector and generator CLI

**Files:**
- Create: `scripts/dashboard/github-data.mjs`
- Create: `scripts/generate-dashboard.mjs`
- Create: `tests/github-data.test.mjs`
- Create: `tests/generate-dashboard.test.mjs`
- Modify: `tests/fixtures/dashboard-data.json`
- Create: `assets/github-dashboard.svg`

**Interfaces:**
- Produces: `normalizeGitHubData(pages, generatedAt): DashboardData` and `fetchGitHubData({ token, login, now, request }): Promise<DashboardData>`.
- Consumes: `renderDashboard(data)` from Task 1.
- CLI inputs: `GITHUB_TOKEN`, optional `GITHUB_USER` defaulting to `thelzf`, optional `DASHBOARD_DATA_FILE`, and optional `DASHBOARD_OUTPUT` defaulting to `assets/github-dashboard.svg`.

- [ ] **Step 1: Write failing aggregation and CLI tests**

Test pagination with two synthetic GraphQL pages. Assert repository totals, summed stars, follower count, annual commits/contributions, language sizes merged by name, sorted languages, calendar preservation, and a fixed `generatedAt`. In the CLI test, run with `DASHBOARD_DATA_FILE=tests/fixtures/dashboard-data.json` and a temporary output path, then compare two generated files byte-for-byte.

```js
test('aggregates paginated repositories and languages', () => {
  const data = normalizeGitHubData(pages, '2026-09-09T12:00:00Z');
  assert.deepEqual(data.metrics, {
    repositories: 3, followers: 18, stars: 12,
    commitsThisYear: 124, contributionsThisYear: 248,
  });
  assert.deepEqual(data.languages[0], { name: 'TypeScript', color: '#3178c6', size: 900 });
});
```

- [ ] **Step 2: Run collector tests and verify RED**

Run: `node --test tests/github-data.test.mjs tests/generate-dashboard.test.mjs`

Expected: FAIL because the collector and CLI modules do not exist.

- [ ] **Step 3: Implement GraphQL pagination and normalization**

Query `user(login:)`, `followers.totalCount`, `contributionsCollection(from:, to:)`, `totalCommitContributions`, `contributionCalendar`, and `repositories(first: 100, after:, privacy: PUBLIC, ownerAffiliations: OWNER)`. For each repository request `stargazerCount` and `languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }`. Continue until `pageInfo.hasNextPage` is false. Throw descriptive errors for missing token, non-2xx HTTP, GraphQL errors, or missing user.

```js
export async function fetchGitHubData({ token, login = 'thelzf', now = new Date(), request = fetch }) {
  if (!token) throw new Error('GITHUB_TOKEN is required for live generation');
  const from = `${now.getUTCFullYear()}-01-01T00:00:00Z`;
  const to = `${now.getUTCFullYear()}-12-31T23:59:59Z`;
  const pages = await fetchRepositoryPages({ token, login, from, to, request });
  return normalizeGitHubData(pages, now.toISOString());
}
```

- [ ] **Step 4: Implement the atomic generator CLI**

Read fixture data when `DASHBOARD_DATA_FILE` exists; otherwise call `fetchGitHubData`. Render to a sibling temporary file and rename it to the requested output only after successful rendering. Create the output directory recursively.

- [ ] **Step 5: Run all Node tests and generate the fixture SVG**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass.

Run: `DASHBOARD_DATA_FILE=tests/fixtures/dashboard-data.json node scripts/generate-dashboard.mjs`

Expected: `assets/github-dashboard.svg` is created and contains a complete closing `</svg>` tag.

- [ ] **Step 6: Commit collector, CLI, tests, and initial SVG**

```bash
git add scripts/dashboard/github-data.mjs scripts/generate-dashboard.mjs tests assets/github-dashboard.svg
git commit -m "Generate profile dashboard from GitHub data"
```

### Task 3: Portrait artwork and README integration

**Files:**
- Create: `assets/profile-hero.png`
- Modify: `README.md:1-42`
- Test: `tests/readme-assets.test.mjs`

**Interfaces:**
- Consumes: `assets/github-dashboard.svg` from Task 2 and the user-provided source image `/home/thelzf/Downloads/ChatGPT Image 9 de set. de 2026, 09_04_33.png`.
- Produces: a repository-owned hero asset and a README block containing only relative asset references.

- [ ] **Step 1: Write and run a failing README asset test**

```js
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('README uses repository-owned custom dashboard assets', async () => {
  const readme = await readFile('README.md', 'utf8');
  await access('assets/profile-hero.png');
  await access('assets/github-dashboard.svg');
  const gadget = readme.slice(readme.indexOf('<!-- github-dashboard:start -->'), readme.indexOf('<!-- github-dashboard:end -->'));
  assert.match(gadget, /assets\/profile-hero\.png/);
  assert.match(gadget, /assets\/github-dashboard\.svg/);
  assert.doesNotMatch(gadget, /vercel\.app|shields\.io|demolab\.com/);
});
```

Run: `node --test tests/readme-assets.test.mjs`

Expected: FAIL because `assets/profile-hero.png` is absent and the gadget still references generic services.

- [ ] **Step 2: Prepare the portrait artwork**

Create `assets/profile-hero.png` from the supplied artwork, retaining the illustrated developer with glasses and the black/blue neon identity. Remove or avoid presenting the illustrative hard-coded GitHub statistics in the hero so they cannot conflict with the live dashboard. Optimize the PNG while keeping text and facial details sharp.

- [ ] **Step 3: Replace only the marked README gadget**

Use this structure and preserve all bytes after the end marker:

```html
<!-- github-dashboard:start -->
<div align="center">
  <img src="assets/profile-hero.png" width="100%" alt="Luiz Felipe — desenvolvedor em ambiente neon">
  <img src="assets/github-dashboard.svg" width="100%" alt="Dashboard dinâmico do perfil GitHub de thelzf">
</div>
<!-- github-dashboard:end -->
```

- [ ] **Step 4: Run README tests and verify GREEN**

Run: `node --test tests/readme-assets.test.mjs`

Expected: test passes with no generic widget domains in the marked block.

- [ ] **Step 5: Commit artwork and integration**

```bash
git add assets/profile-hero.png README.md tests/readme-assets.test.mjs
git commit -m "Integrate personalized profile artwork"
```

### Task 4: Scheduled regeneration workflow and end-to-end verification

**Files:**
- Create: `.github/workflows/update-profile-dashboard.yml`
- Create: `tests/workflow.test.mjs`

**Interfaces:**
- Consumes: `scripts/generate-dashboard.mjs`, repository `GITHUB_TOKEN`, and GitHub-hosted Node.js 20.
- Produces: scheduled or manually triggered updates to `assets/github-dashboard.svg` on `main`.

- [ ] **Step 1: Write and run a failing workflow contract test**

Read the workflow as text and assert it contains `schedule:`, `workflow_dispatch:`, `contents: write`, `node-version: 20`, `node scripts/generate-dashboard.mjs`, `GITHUB_TOKEN:`, and a guarded commit command. Assert it does not contain `pull_request:` or `push:` triggers.

Run: `node --test tests/workflow.test.mjs`

Expected: FAIL because the workflow does not exist.

- [ ] **Step 2: Add the daily workflow**

Create a workflow scheduled with `cron: '17 6 * * *'`, manual dispatch, `permissions: contents: write`, checkout, Node 20 setup, generator execution with `${{ secrets.GITHUB_TOKEN }}`, and a commit step guarded by `git diff --quiet -- assets/github-dashboard.svg`. Configure the bot identity as `github-actions[bot]` and push normally to the checked-out branch.

- [ ] **Step 3: Run all tests and static checks**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass.

Run: `git diff --check`

Expected: exit code `0` with no output.

Run: `xmllint --noout assets/github-dashboard.svg`

Expected: exit code `0`. If `xmllint` is unavailable, use Node's XML-compatible structural assertions from the renderer test and report that limitation.

- [ ] **Step 4: Generate with live GitHub data**

Run: `GITHUB_TOKEN="$GITHUB_TOKEN" GITHUB_USER=thelzf node scripts/generate-dashboard.mjs`

Expected: exit code `0`, no token in output, and a refreshed `assets/github-dashboard.svg` labeled with the current year.

- [ ] **Step 5: Render and inspect both assets**

Render `assets/github-dashboard.svg` to PNG, inspect it together with `assets/profile-hero.png`, and confirm no clipping, overlap, unreadable small text, fabricated numbers, or horizontal overflow at desktop and 390 px equivalent widths.

- [ ] **Step 6: Commit workflow and final generated dashboard**

```bash
git add .github/workflows/update-profile-dashboard.yml tests/workflow.test.mjs assets/github-dashboard.svg
git commit -m "Automate profile dashboard updates"
```

- [ ] **Step 7: Verify repository state before publishing**

Run: `git status --short`

Expected: no output.

Run: `git log --oneline -6`

Expected: the design, renderer, generator, artwork, and workflow commits are visible in order.
