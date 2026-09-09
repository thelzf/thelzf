const HEAT_COLORS = {
  NONE: '#0d1829',
  FIRST_QUARTILE: '#0c2d6b',
  SECOND_QUARTILE: '#0754b8',
  THIRD_QUARTILE: '#1684ff',
  FOURTH_QUARTILE: '#54c7ff',
};

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const formatNumber = (value) =>
  new Intl.NumberFormat('pt-BR').format(Number(value) || 0);

function contributionGrid(calendar) {
  const weekCount = Math.max(calendar.length, 1);
  const cell = Math.min(17, Math.floor(1020 / weekCount));
  const square = Math.max(8, cell - 4);

  return calendar
    .flatMap((week, weekIndex) =>
      week.days.map((day) => {
        const x = 112 + weekIndex * cell;
        const y = 118 + day.weekday * 20;
        const color = HEAT_COLORS[day.level] || HEAT_COLORS.NONE;
        return `<rect x="${x}" y="${y}" width="${square}" height="${square}" rx="3" fill="${color}"><title>${escapeXml(day.date)}: ${formatNumber(day.count)} contribuições</title></rect>`;
      }),
    )
    .join('');
}

export function renderDashboard(data) {
  const name = data.user.name || data.user.login;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300" role="img" aria-labelledby="title desc">
  <title id="title">Calendário de contribuições de ${escapeXml(name)}</title>
  <desc id="desc">Mapa anual das contribuições públicas de ${escapeXml(data.user.login)} no GitHub.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#01030a"/>
      <stop offset="0.55" stop-color="#030712"/>
      <stop offset="1" stop-color="#061936"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="#1677ff"/>
      <stop offset="1" stop-color="#54c7ff"/>
    </linearGradient>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .eyebrow { fill: #38bdf8; font-size: 13px; font-weight: 700; letter-spacing: 4px; }
      .heading { fill: #f8fafc; font-size: 25px; font-weight: 800; }
      .muted { fill: #8eaccd; font-size: 12px; letter-spacing: 1px; }
    </style>
  </defs>
  <rect x="1" y="1" width="1198" height="298" rx="28" fill="url(#background)" stroke="#1684ff" stroke-width="2"/>
  <path d="M32 4 H1168" stroke="url(#accent)" stroke-width="3" filter="url(#glow)"/>
  <text x="48" y="48" class="eyebrow">GITHUB / ACTIVITY SIGNAL</text>
  <text x="48" y="82" class="heading">CONTRIBUIÇÕES / ${escapeXml(data.year)}</text>
  <text x="1152" y="78" text-anchor="end" class="muted">${escapeXml(name)} · @${escapeXml(data.user.login)}</text>
  <text x="48" y="130" class="muted">DOM</text>
  <text x="48" y="170" class="muted">TER</text>
  <text x="48" y="210" class="muted">QUI</text>
  <text x="48" y="250" class="muted">SÁB</text>
  ${contributionGrid(data.calendar)}
  <g transform="translate(886 260)">
    <text x="0" y="11" class="muted">MENOS</text>
    ${Object.values(HEAT_COLORS).map((color, index) => `<rect x="${68 + index * 25}" y="0" width="16" height="16" rx="4" fill="${color}"/>`).join('')}
    <text x="208" y="11" class="muted">MAIS</text>
  </g>
</svg>
`;
}
