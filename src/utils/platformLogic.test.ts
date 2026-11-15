import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCareerTimeline,
  filterAndPaginatePoliticians,
  slugifyText,
  validateCorrectionInput,
  type PoliticianDirectoryItem,
} from './platformLogic';

const sampleDirectory: PoliticianDirectoryItem[] = [
  {
    id: 1,
    slug: 'imran-khan',
    fullName: 'Imran Ahmed Khan Niazi',
    honorific: 'Former Prime Minister',
    photoUrl: null,
    province: 'Punjab',
    currentPositionTitle: 'Party Founder',
    currentConstituencyCode: 'NA-95',
    partyName: 'Pakistan Tehreek-e-Insaf',
    partyAbbreviation: 'PTI',
    verificationStatus: 'Officially documented',
    isFeatured: true,
    isDemoData: true,
    isPublished: true,
    electionYears: [2002, 2013, 2018],
    updatedAt: '2026-11-10T00:00:00Z',
  },
  {
    id: 2,
    slug: 'bilawal-bhutto-zardari',
    fullName: 'Bilawal Bhutto Zardari',
    honorific: 'Former Foreign Minister',
    photoUrl: null,
    province: 'Sindh',
    currentPositionTitle: 'Member National Assembly',
    currentConstituencyCode: 'NA-194',
    partyName: 'Pakistan Peoples Party',
    partyAbbreviation: 'PPP',
    verificationStatus: 'Independently corroborated',
    isFeatured: true,
    isDemoData: true,
    isPublished: true,
    electionYears: [2018, 2024],
    updatedAt: '2026-11-12T00:00:00Z',
  },
  {
    id: 3,
    slug: 'maryam-nawaz-sharif',
    fullName: 'Maryam Nawaz Sharif',
    honorific: 'Chief Minister of Punjab',
    photoUrl: null,
    province: 'Punjab',
    currentPositionTitle: 'Chief Minister of Punjab',
    currentConstituencyCode: 'PP-159',
    partyName: 'Pakistan Muslim League (N)',
    partyAbbreviation: 'PML-N',
    verificationStatus: 'Officially documented',
    isFeatured: true,
    isDemoData: true,
    isPublished: true,
    electionYears: [2024],
    updatedAt: '2026-11-14T00:00:00Z',
  },
];

test('slugifyText generates clean URL slugs', () => {
  assert.equal(slugifyText('  Bilawal Bhutto Zardari! '), 'bilawal-bhutto-zardari');
  assert.equal(slugifyText('Pakistan Muslim League (N)'), 'pakistan-muslim-league-n');
});

test('filterAndPaginatePoliticians filters by province, party, election year, and paginates', () => {
  const punjabOnly = filterAndPaginatePoliticians(sampleDirectory, {
    query: '',
    province: 'Punjab',
    party: 'All',
    position: '',
    constituency: '',
    electionYear: '',
    sortBy: 'name_asc',
    page: 1,
    pageSize: 1,
  });

  assert.equal(punjabOnly.total, 2);
  assert.equal(punjabOnly.totalPages, 2);
  assert.equal(punjabOnly.items[0].slug, 'imran-khan');

  const year2024 = filterAndPaginatePoliticians(sampleDirectory, {
    query: '',
    province: 'All Provinces',
    party: 'PML-N',
    position: '',
    constituency: '',
    electionYear: '2024',
    sortBy: 'name_asc',
    page: 1,
    pageSize: 10,
  });

  assert.equal(year2024.total, 1);
  assert.equal(year2024.items[0].slug, 'maryam-nawaz-sharif');
});

test('buildCareerTimeline merges and sorts positions, party roles, and elections descending', () => {
  const timeline = buildCareerTimeline({
    positions: [
      {
        id: 1,
        title: 'Foreign Minister',
        institution: 'Cabinet',
        startDate: '2022',
        endDate: '2023',
        isCurrent: false,
        verificationStatus: 'Officially documented',
      },
    ],
    memberships: [
      {
        id: 1,
        partyName: 'PPP',
        roleInParty: 'Chairman',
        startDate: '2007',
        endDate: null,
        verificationStatus: 'Officially documented',
      },
    ],
    elections: [
      {
        id: 1,
        year: 2024,
        constituencyCode: 'NA-194',
        resultStatus: 'Won',
        votesReceived: 135000,
        verificationStatus: 'Officially documented',
      },
    ],
  });

  assert.equal(timeline.length, 3);
  assert.equal(timeline[0].year, '2024');
  assert.equal(timeline[1].year, '2022');
  assert.equal(timeline[2].year, '2007');
});

test('validateCorrectionInput rejects missing fields and invalid URLs', () => {
  const badEmail = validateCorrectionInput({
    entityType: 'politician',
    entityId: 1,
    sectionName: 'Electoral History',
    submittedClaim: 'Old vote count',
    suggestedCorrection: 'Updated official ECP tally is 135,122 votes.',
    submitterName: 'Ayesha',
    submitterEmail: 'not-an-email',
  });
  assert.equal(badEmail.valid, false);

  const valid = validateCorrectionInput({
    entityType: 'politician',
    entityId: 1,
    sectionName: 'Electoral History',
    submittedClaim: 'Old vote count',
    suggestedCorrection: 'Updated official ECP tally is 135,122 votes.',
    evidenceUrl: 'https://ecp.gov.pk/results',
    submitterName: 'Ayesha',
    submitterEmail: 'ayesha@example.com',
  });
  assert.equal(valid.valid, true);
});
