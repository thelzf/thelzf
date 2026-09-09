const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatNumber = (value) =>
  new Intl.NumberFormat('pt-BR').format(Number(value) || 0);

const languageBar = (percent) => {
  const filled = Math.round(percent / 5);
  return `${'█'.repeat(filled)}${'░'.repeat(20 - filled)}`;
};

export function renderStatsMarkup(data) {
  const languageTotal = data.languages.reduce(
    (sum, language) => sum + Number(language.size || 0),
    0,
  );
  const languages = data.languages.slice(0, 6).map((language) => ({
    ...language,
    percent:
      languageTotal === 0 ? 0 : (Number(language.size) / languageTotal) * 100,
  }));
  const updatedAt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data.generatedAt));

  const metrics = [
    [data.metrics.repositories, 'Repositórios'],
    [data.metrics.followers, 'Seguidores'],
    [data.metrics.stars, 'Estrelas'],
    [data.metrics.commitsThisYear, `Commits em ${data.year}`],
    [data.metrics.contributionsThisYear, `Contribuições em ${data.year}`],
  ];

  return `<h2>⚡ ${escapeHtml(data.user.name || data.user.login)} · GitHub Live</h2>

<table>
  <tr>
${metrics
  .map(
    ([value, label]) =>
      `    <td align="center"><strong>${escapeHtml(formatNumber(value))}</strong><br>${escapeHtml(label)}</td>`,
  )
  .join('\n')}
  </tr>
</table>

<h3>⌁ Linguagens mais usadas</h3>

${languages
  .map(
    (language) =>
      `<code>${languageBar(language.percent)}</code> ${escapeHtml(language.name)} — ${language.percent.toFixed(1)}%`,
  )
  .join('<br>\n')}

<sub>Dados públicos do GitHub · atualizado em ${escapeHtml(updatedAt)} UTC</sub>`;
}

export function injectStatsMarkup(readme, markup) {
  const startMarker = '<!-- github-stats:start -->';
  const endMarker = '<!-- github-stats:end -->';
  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker);

  if (start < 0 || end < start) {
    throw new Error('README stats markers are missing or out of order');
  }

  const contentStart = start + startMarker.length;
  return `${readme.slice(0, contentStart)}\n${markup}\n${readme.slice(end)}`;
}
