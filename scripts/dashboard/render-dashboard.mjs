const PALETTE = {
  background: '#030712',
  panel: '#071426',
  panelSoft: '#0a1b32',
  border: '#123769',
  primary: '#38bdf8',
  secondary: '#1677ff',
  text: '#f8fafc',
  muted: '#8eaccd',
};

const HEAT_COLORS = {
  NONE: '#0d1829',
  FIRST_QUARTILE: '#0c2d6b',
  SECOND_QUARTILE: '#0754b8',
  THIRD_QUARTILE: '#1684ff',
  FOURTH_QUARTILE: '#54c7ff',
};

export const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const formatNumber = (value) =>
  new Intl.NumberFormat('pt-BR').format(Number(value) || 0);

function metricCard({ x, width, label, value }) {
  const labelParts = label.split(' EM ');
  const labelMarkup =
    labelParts.length === 2
      ? `<tspan x="36" dy="0">${escapeXml(labelParts[0])}</tspan><tspan x="36" dy="16">EM ${escapeXml(labelParts[1])}</tspan>`
      : escapeXml(label);
  return `
    <g transform="translate(${x} 0)">
      <rect width="${width}" height="112" rx="18" fill="${PALETTE.panelSoft}" stroke="${PALETTE.border}"/>
      <rect x="18" y="18" width="4" height="34" rx="2" fill="${PALETTE.primary}" filter="url(#glow)"/>
      <text x="36" y="35" class="label">${labelMarkup}</text>
      <text x="22" y="86" class="metric">${escapeXml(formatNumber(value))}</text>
    </g>`;
}

function languageRows(languages) {
  return languages
    .map((language, index) => {
      const y = 380 + index * 43;
      const color = language.color || PALETTE.muted;
      const barWidth = Math.max(4, Math.round(language.percent * 3.7));
      return `
      <g>
        <circle cx="72" cy="${y - 6}" r="7" fill="${escapeXml(color)}"/>
        <text x="92" y="${y}" class="language">${escapeXml(language.name)}</text>
        <rect x="250" y="${y - 18}" width="370" height="16" rx="8" fill="#0d1d31"/>
        <rect x="250" y="${y - 18}" width="${barWidth}" height="16" rx="8" fill="${escapeXml(color)}"/>
        <text x="640" y="${y}" class="percent">${language.percent.toFixed(1)}%</text>
      </g>`;
    })
    .join('');
}

function contributionGrid(calendar) {
  return calendar
    .flatMap((week, weekIndex) =>
      week.days.map((day) => {
        const x = 742 + weekIndex * 15;
        const y = 374 + day.weekday * 15;
        const color = HEAT_COLORS[day.level] || HEAT_COLORS.NONE;
        return `<rect x="${x}" y="${y}" width="11" height="11" rx="2" fill="${color}"><title>${escapeXml(day.date)}: ${formatNumber(day.count)} contribuições</title></rect>`;
      }),
    )
    .join('');
}

export function renderDashboard(data) {
  const languageTotal = data.languages.reduce(
    (sum, language) => sum + Number(language.size || 0),
    0,
  );
  const languages = data.languages.slice(0, 6).map((language) => ({
    ...language,
    percent:
      languageTotal === 0 ? 0 : (Number(language.size) / languageTotal) * 100,
  }));
  const metrics = [
    ['REPOSITÓRIOS', data.metrics.repositories],
    ['FOLLOWERS', data.metrics.followers],
    ['STARS', data.metrics.stars],
    [`COMMITS EM ${data.year}`, data.metrics.commitsThisYear],
    [`CONTRIBUIÇÕES EM ${data.year}`, data.metrics.contributionsThisYear],
  ];
  const metricWidth = 204;
  const gap = 18;
  const generated = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data.generatedAt));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
  <title id="title">Dashboard GitHub de ${escapeXml(data.user.login)}</title>
  <desc id="desc">Estatísticas públicas, linguagens e contribuições anuais de ${escapeXml(data.user.name || data.user.login)}.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#01030a"/>
      <stop offset="0.52" stop-color="${PALETTE.background}"/>
      <stop offset="1" stop-color="#061936"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="${PALETTE.secondary}"/>
      <stop offset="1" stop-color="${PALETTE.primary}"/>
    </linearGradient>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .eyebrow { fill: ${PALETTE.primary}; font-size: 15px; font-weight: 700; letter-spacing: 5px; }
      .title { fill: ${PALETTE.text}; font-size: 42px; font-weight: 800; }
      .subtitle { fill: ${PALETTE.muted}; font-size: 17px; }
      .section { fill: ${PALETTE.text}; font-size: 19px; font-weight: 750; }
      .label { fill: ${PALETTE.muted}; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
      .metric { fill: ${PALETTE.text}; font-size: 31px; font-weight: 800; }
      .language { fill: ${PALETTE.text}; font-size: 16px; font-weight: 600; }
      .percent { fill: ${PALETTE.muted}; font-size: 14px; text-anchor: end; }
      .sequence { fill: ${PALETTE.primary}; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
      .tiny { fill: ${PALETTE.muted}; font-size: 12px; letter-spacing: 1px; }
    </style>
  </defs>
  <rect x="1" y="1" width="1198" height="718" rx="32" fill="url(#background)" stroke="#1684ff" stroke-width="2"/>
  <path d="M35 5 H1165" stroke="url(#accent)" stroke-width="3" filter="url(#glow)"/>
  <circle cx="1090" cy="86" r="50" fill="none" stroke="#1684ff" opacity=".35"/>
  <circle cx="1090" cy="86" r="35" fill="none" stroke="#54c7ff" opacity=".7" filter="url(#glow)"/>
  <path d="M1072 86h36M1090 68v36" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
  <text x="58" y="58" class="eyebrow">GITHUB / LIVE PROFILE</text>
  <text x="58" y="108" class="title">${escapeXml(data.user.name || data.user.login)}</text>
  <text x="58" y="140" class="subtitle">@${escapeXml(data.user.login)}  ·  ${escapeXml(data.user.bio || 'Software Developer')}</text>
  <g transform="translate(58 184)">
    ${metrics.map(([label, value], index) => metricCard({ x: index * (metricWidth + gap), width: metricWidth, label, value })).join('')}
  </g>
  <line x1="58" y1="327" x2="1142" y2="327" stroke="${PALETTE.border}"/>
  <text x="58" y="352" class="section">LINGUAGENS MAIS USADAS</text>
  ${languageRows(languages)}
  <text x="720" y="352" class="section">CONTRIBUIÇÕES / ${escapeXml(data.year)}</text>
  ${contributionGrid(data.calendar)}
  <g transform="translate(742 510)">
    <text x="0" y="10" class="tiny">MENOS</text>
    ${Object.values(HEAT_COLORS).map((color, index) => `<rect x="${58 + index * 22}" y="0" width="14" height="14" rx="3" fill="${color}"/>`).join('')}
    <text x="181" y="10" class="tiny">MAIS</text>
  </g>
  <line x1="720" y1="560" x2="1142" y2="560" stroke="${PALETTE.border}"/>
  <text x="720" y="594" class="sequence">CODE · BUILD · IMPROVE · REPEAT</text>
  <text x="720" y="630" class="subtitle">BUILDING A BETTER TOMORROW</text>
  <text x="58" y="681" class="tiny">DADOS PÚBLICOS DO GITHUB · ATUALIZADO EM ${escapeXml(generated)} UTC</text>
  <path d="M1085 672h43l10 9-10 9h-43" fill="none" stroke="${PALETTE.primary}" stroke-width="2"/>
</svg>
`;
}
