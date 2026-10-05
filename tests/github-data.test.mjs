import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeGitHubData } from '../scripts/dashboard/github-data.mjs';

const contributionData = {
  totalCommitContributions: 124,
  contributionCalendar: {
    totalContributions: 248,
    weeks: [
      {
        firstDay: '2026-01-04',
        contributionDays: [
          {
            date: '2026-01-04',
            weekday: 0,
            contributionCount: 2,
            contributionLevel: 'FIRST_QUARTILE',
          },
        ],
      },
    ],
  },
};

const pages = [
  {
    user: {
      login: 'thelzf',
      name: 'Luiz Felipe',
      bio: 'Software Developer',
      avatarUrl: 'https://example.test/avatar.png',
      followers: { totalCount: 18 },
      contributionsCollection: contributionData,
      repositories: {
        totalCount: 3,
        nodes: [
          {
            stargazerCount: 5,
            languages: {
              edges: [
                { size: 500, node: { name: 'TypeScript', color: '#3178c6' } },
                { size: 200, node: { name: 'PHP', color: '#4F5D95' } },
              ],
            },
          },
          {
            stargazerCount: 4,
            languages: {
              edges: [{ size: 300, node: { name: 'TypeScript', color: '#3178c6' } }],
            },
          },
        ],
        pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
      },
    },
  },
  {
    user: {
      login: 'thelzf',
      repositories: {
        totalCount: 3,
        nodes: [
          {
            stargazerCount: 3,
            languages: {
              edges: [
                { size: 100, node: { name: 'TypeScript', color: '#3178c6' } },
                { size: 400, node: { name: 'PHP', color: '#4F5D95' } },
              ],
            },
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  },
];

test('aggregates paginated repositories and languages', () => {
  const data = normalizeGitHubData(pages, '2026-09-09T12:00:00.000Z');

  assert.deepEqual(data.metrics, {
    repositories: 3,
    followers: 18,
    stars: 12,
    commitsThisYear: 124,
    contributionsThisYear: 248,
  });
  assert.equal(data.languages[0].name, 'TypeScript');
  assert.ok(Math.abs(data.languages[0].size - (500 / 700 * 100 + 100 + 100 / 500 * 100)) < 0.000001);
  assert.ok(Math.abs(data.languages[1].size - (200 / 700 * 100 + 400 / 500 * 100)) < 0.000001);
  assert.equal(data.calendar[0].days[0].level, 'FIRST_QUARTILE');
  assert.equal(data.year, 2026);
});

test('weights repositories similarly instead of letting a large repository dominate', () => {
  const data = normalizeGitHubData([
    {
      user: {
        ...pages[0].user,
        repositories: {
          totalCount: 4,
          nodes: [
            {
              stargazerCount: 0,
              languages: {
                edges: [
                  { size: 10000, node: { name: 'PHP', color: '#4F5D95' } },
                  { size: 100, node: { name: 'JavaScript', color: '#f1e05a' } },
                ],
              },
            },
            {
              stargazerCount: 0,
              languages: {
                edges: [{ size: 100, node: { name: 'JavaScript', color: '#f1e05a' } }],
              },
            },
            {
              stargazerCount: 0,
              languages: { edges: [] },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    },
  ], '2026-09-09T12:00:00.000Z');

  assert.equal(data.languages[0].name, 'JavaScript');
  assert.ok(data.languages[0].size > data.languages[1].size);
  assert.ok(data.languages[1].size < 100);
});
