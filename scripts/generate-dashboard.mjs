import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { fetchGitHubData } from './dashboard/github-data.mjs';
import { renderDashboard } from './dashboard/render-dashboard.mjs';
import {
  injectStatsMarkup,
  renderStatsMarkup,
} from './dashboard/render-stats-markup.mjs';

const outputPath = resolve(
  process.env.DASHBOARD_OUTPUT || 'assets/github-dashboard.svg',
);
const readmePath = resolve(process.env.DASHBOARD_README || 'README.md');

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
  const svg = renderDashboard(data);
  const readme = await readFile(readmePath, 'utf8');
  const updatedReadme = injectStatsMarkup(readme, renderStatsMarkup(data));

  await mkdir(dirname(outputPath), { recursive: true });
  await writeAtomically(outputPath, svg);
  await writeAtomically(readmePath, updatedReadme);
  process.stdout.write(`Dashboard generated at ${outputPath} and ${readmePath}\n`);
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
