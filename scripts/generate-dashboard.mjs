import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { fetchGitHubData } from './dashboard/github-data.mjs';
import { renderDashboard } from './dashboard/render-dashboard.mjs';

const outputPath = resolve(
  process.env.DASHBOARD_OUTPUT || 'assets/github-dashboard.svg',
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
  const svg = renderDashboard(data);
  const temporaryPath = `${outputPath}.tmp`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, svg, 'utf8');
  await rename(temporaryPath, outputPath);
  process.stdout.write(`Dashboard generated at ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
