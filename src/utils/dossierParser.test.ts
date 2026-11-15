import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractGroundingSources,
  extractJsonObject,
  parsePoliticianDossier,
  validateSearchQuery,
} from './dossierParser';

test('validateSearchQuery trims whitespace and rejects invalid inputs', () => {
  assert.deepEqual(validateSearchQuery(''), {
    valid: false,
    normalized: '',
    error: 'Please enter the name of a Pakistani politician to look up.',
  });
  assert.deepEqual(validateSearchQuery('   '), {
    valid: false,
    normalized: '',
    error: 'Please enter the name of a Pakistani politician to look up.',
  });
  assert.equal(validateSearchQuery('A').valid, false);
  assert.deepEqual(validateSearchQuery('  Imran   Khan  '), {
    valid: true,
    normalized: 'Imran Khan',
  });
});

test('extractJsonObject handles markdown fences and surrounding prose', () => {
  const fenced = 'Here is the record:\n```json\n{"fullName":"Imran Khan","found":true}\n```\nDone.';
  assert.deepEqual(extractJsonObject(fenced), { fullName: 'Imran Khan', found: true });

  const noisy = 'Verified: {"fullName": "Bilawal Bhutto", "nested": {"ok": true}} end.';
  assert.deepEqual(extractJsonObject(noisy), {
    fullName: 'Bilawal Bhutto',
    nested: { ok: true },
  });
});

test('extractGroundingSources deduplicates URLs and formats domain names', () => {
  const chunks = [
    { web: { uri: 'https://www.dawn.com/news/123', title: 'Dawn News Report' } },
    { web: { uri: 'https://www.dawn.com/news/123', title: 'Duplicate Dawn' } },
    { web: { uri: 'https://ecp.gov.pk/assets', title: '' } },
    { web: { uri: 'javascript:alert(1)', title: 'Bad URL' } },
  ];

  const sources = extractGroundingSources(chunks);
  assert.equal(sources.length, 2);
  assert.deepEqual(sources[0], {
    title: 'Dawn News Report',
    url: 'https://www.dawn.com/news/123',
    domain: 'dawn.com',
  });
  assert.deepEqual(sources[1], {
    title: 'ecp.gov.pk',
    url: 'https://ecp.gov.pk/assets',
    domain: 'ecp.gov.pk',
  });
});

test('parsePoliticianDossier normalizes full payload and handles notFound records', () => {
  const notFoundResult = parsePoliticianDossier(
    JSON.stringify({ found: false, reason: 'Not a Pakistani politician.' }),
  );
  assert.equal(notFoundResult.ok, false);
  if (!notFoundResult.ok) {
    assert.equal(notFoundResult.notFound, true);
    assert.equal(notFoundResult.error, 'Not a Pakistani politician.');
  }

  const validPayload = JSON.stringify({
    found: true,
    fullName: 'Maryam Nawaz Sharif',
    honorificOrTitle: 'Chief Minister of Punjab',
    politicalParty: 'Pakistan Muslim League (N)',
    partyAbbreviation: 'PML-N',
    currentStatus: 'Chief Minister of Punjab',
    homeBase: 'Lahore, Punjab',
    biographySummary: 'Senior PML-N leader and elected Chief Minister of Punjab.',
    currentOrLastConstituency: 'PP-159 Lahore / NA-119 Lahore',
    electoralOverview: 'Won both NA-119 and PP-159 in the 2024 general elections.',
    electoralHistory: [
      {
        electionYear: '2024',
        constituency: 'PP-159 Lahore',
        assembly: 'Provincial Assembly of Punjab',
        outcome: 'Won',
        voteSummary: '83,597 votes',
      },
    ],
    positions: [
      {
        title: 'Chief Minister of Punjab',
        tenure: 'Feb 2024 – Present',
        institution: 'Government of Punjab',
        description: 'First woman Chief Minister of Punjab.',
      },
    ],
    parliamentaryRolesSummary: 'Leads provincial cabinet and treasury benches in Punjab Assembly.',
    parliamentaryContributions: ['Provincial governance & infrastructure initiatives'],
    declaredNetWorthSummary: 'Over PKR 842 million in declared assets (2024 nomination filing)',
    filingYear: '2024 ECP Nomination Papers',
    assetCategories: [
      {
        category: 'Agricultural & Real Estate Land',
        details: 'Land holdings in Lahore',
        reportedValue: 'PKR 842M+ total portfolio',
      },
    ],
    financialDisclosuresNotes: 'Disclosed in 2024 ECP nomination forms.',
  });

  const parsed = parsePoliticianDossier(
    validPayload,
    [{ web: { uri: 'https://www.geo.tv/latest/123', title: 'Geo News Asset Report' } }],
    ['Maryam Nawaz ECP assets 2024'],
    '2026-11-15T00:00:00.000Z',
  );

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.dossier.fullName, 'Maryam Nawaz Sharif');
    assert.equal(parsed.dossier.electoralHistory.length, 1);
    assert.equal(parsed.dossier.positions.length, 1);
    assert.equal(parsed.dossier.assetCategories.length, 1);
    assert.equal(parsed.dossier.sources.length, 1);
    assert.equal(parsed.dossier.sources[0].domain, 'geo.tv');
    assert.equal(parsed.dossier.retrievedAt, '2026-11-15T00:00:00.000Z');
  }
});
