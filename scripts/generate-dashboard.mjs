import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { fetchGitHubData } from './dashboard/github-data.mjs';
import { renderDashboard } from './dashboard/render-dashboard.mjs';
import { renderLanguagesSvg } from './dashboard/render-languages-svg.mjs';
import { renderStatsSvg } from './dashboard/render-stats-svg.mjs';

const statsOutput = resolve(
  process.env.DASHBOARD_STATS_OUTPUT || 'assets/github-stats.svg',
);
const languagesOutput = resolve(
  process.env.DASHBOARD_LANGUAGES_OUTPUT || 'assets/github-languages.svg',
);
const contributionsOutput = resolve(
  process.env.DASHBOARD_CONTRIBUTIONS_OUTPUT ||
    'assets/github-contributions.svg',
);

async function loadData() {
  if (process.env.DASHBOARD_DATA_FILE) {
    return JSON.parse(
      await readFile(resolve(process.env.DASHBOARD_DATA_FILE), 'utf8'),
    );
  }

  return fetchGitHubData({
    token: process.env.GITHUB_TOKEN,
    login: process.env.GITHUB_USER || 'thelzf',
  });
}

async function main() {
  const data = await loadData();
  const gadgets = [
    [statsOutput, renderStatsSvg(data)],
    [languagesOutput, renderLanguagesSvg(data)],
    [contributionsOutput, renderDashboard(data)],
  ];

  for (const [path, svg] of gadgets) {
    await mkdir(dirname(path), { recursive: true });
    await writeAtomically(path, svg);
  }
  process.stdout.write(`Generated ${gadgets.length} profile gadgets\n`);
}

async function writeAtomically(path, content) {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, content, 'utf8');
  await rename(temporaryPath, path);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
