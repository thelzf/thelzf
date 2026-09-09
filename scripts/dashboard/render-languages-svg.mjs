const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export function renderLanguagesSvg(data) {
  const total = data.languages.reduce(
    (sum, language) => sum + Number(language.size || 0),
    0,
  );
  const languages = data.languages.slice(0, 6).map((language) => ({
    ...language,
    percent: total === 0 ? 0 : (Number(language.size) / total) * 100,
  }));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="390" viewBox="0 0 1200 390" role="img" aria-labelledby="title desc">
  <title id="title">Linguagens mais usadas por ${escapeXml(data.user.login)}</title>
  <desc id="desc">Distribuição das seis linguagens mais usadas nos repositórios públicos próprios.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#01030a"/><stop offset=".55" stop-color="#030712"/><stop offset="1" stop-color="#061936"/></linearGradient>
    <linearGradient id="accent"><stop stop-color="#1677ff"/><stop offset="1" stop-color="#54c7ff"/></linearGradient>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <style>
      text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .eyebrow { fill: #38bdf8; font-size: 13px; font-weight: 700; letter-spacing: 4px; }
      .heading { fill: #f8fafc; font-size: 25px; font-weight: 800; }
      .language { fill: #f8fafc; font-size: 17px; font-weight: 650; }
      .percent { fill: #8eaccd; font-size: 15px; text-anchor: end; }
    </style>
  </defs>
  <rect x="1" y="1" width="1198" height="388" rx="28" fill="url(#background)" stroke="#1684ff" stroke-width="2"/>
  <path d="M32 4 H1168" stroke="url(#accent)" stroke-width="3" filter="url(#glow)"/>
  <text x="48" y="45" class="eyebrow">GITHUB / CODE SPECTRUM</text>
  <text x="48" y="80" class="heading">LINGUAGENS MAIS USADAS</text>
${languages.map((language, index) => {
    const y = 125 + index * 43;
    const color = language.color || '#8eaccd';
    const width = Math.max(4, Math.round(language.percent * 8));
    return `  <g>
    <circle cx="64" cy="${y - 6}" r="7" fill="${escapeXml(color)}"/>
    <text x="86" y="${y}" class="language">${escapeXml(language.name)}</text>
    <rect x="300" y="${y - 18}" width="800" height="17" rx="8.5" fill="#0d1d31"/>
    <rect x="300" y="${y - 18}" width="${width}" height="17" rx="8.5" fill="${escapeXml(color)}"/>
    <text x="1140" y="${y}" class="percent">${language.percent.toFixed(1)}%</text>
  </g>`;
  }).join('\n')}
</svg>
`;
}
