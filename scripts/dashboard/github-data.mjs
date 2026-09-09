const QUERY = `
  query ProfileDashboard($login: String!, $cursor: String, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      name
      bio
      avatarUrl
      followers { totalCount }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
            }
          }
        }
      }
      repositories(first: 100, after: $cursor, privacy: PUBLIC, ownerAffiliations: OWNER) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export function normalizeGitHubData(pages, generatedAt) {
  if (!pages.length || !pages[0].user) {
    throw new Error('GitHub user was not found');
  }

  const profile = pages[0].user;
  const contributions = profile.contributionsCollection;
  const languageMap = new Map();
  let stars = 0;

  for (const page of pages) {
    for (const repository of page.user.repositories.nodes) {
      stars += repository.stargazerCount;
      for (const edge of repository.languages.edges) {
        const current = languageMap.get(edge.node.name) || {
          name: edge.node.name,
          color: edge.node.color || '#8eaccd',
          size: 0,
        };
        current.size += edge.size;
        languageMap.set(edge.node.name, current);
      }
    }
  }

  const calendar = contributions.contributionCalendar.weeks.map((week) => ({
    firstDay: week.firstDay,
    days: week.contributionDays.map((day) => ({
      date: day.date,
      weekday: day.weekday,
      count: day.contributionCount,
      level: day.contributionLevel,
    })),
  }));

  return {
    user: {
      login: profile.login,
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
    },
    metrics: {
      repositories: profile.repositories.totalCount,
      followers: profile.followers.totalCount,
      stars,
      commitsThisYear: contributions.totalCommitContributions,
      contributionsThisYear: contributions.contributionCalendar.totalContributions,
    },
    languages: [...languageMap.values()].sort(
      (left, right) => right.size - left.size || left.name.localeCompare(right.name),
    ),
    calendar,
    year: new Date(generatedAt).getUTCFullYear(),
    generatedAt,
  };
}

export async function fetchGitHubData({
  token,
  login = 'thelzf',
  now = new Date(),
  request = fetch,
}) {
  if (!token) {
    throw new Error('GITHUB_TOKEN is required for live generation');
  }

  const year = now.getUTCFullYear();
  const variables = {
    login,
    cursor: null,
    from: `${year}-01-01T00:00:00Z`,
    to: `${year}-12-31T23:59:59Z`,
  };
  const pages = [];

  do {
    const response = await request('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'thelzf-profile-dashboard',
      },
      body: JSON.stringify({ query: QUERY, variables }),
    });

    if (!response.ok) {
      throw new Error(`GitHub GraphQL request failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(`GitHub GraphQL error: ${payload.errors.map((error) => error.message).join('; ')}`);
    }
    if (!payload.data?.user) {
      throw new Error(`GitHub user ${login} was not found`);
    }

    pages.push(payload.data);
    const pageInfo = payload.data.user.repositories.pageInfo;
    variables.cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (variables.cursor);

  return normalizeGitHubData(pages, now.toISOString());
}
