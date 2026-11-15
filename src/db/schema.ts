import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('researcher'), // 'admin' | 'editor' | 'researcher'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  publisher: text('publisher').notNull(),
  publicationDate: text('publication_date').notNull(),
  dateCollected: text('date_collected').notNull(),
  lastUpdatedAt: text('last_updated_at').notNull(),
  verificationStatus: text('verification_status').notNull().default('Officially documented'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const politicalParties = pgTable(
  'political_parties',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    abbreviation: text('abbreviation').notNull(),
    foundedYear: integer('founded_year').notNull(),
    foundingLeadership: text('founding_leadership').notNull(),
    currentLeadership: text('current_leadership').notNull(),
    headquarters: text('headquarters').notNull(),
    ideologySummary: text('ideology_summary').notNull(),
    politicalHistory: text('political_history').notNull(),
    parliamentarySeatsSummary: text('parliamentary_seats_summary').notNull(),
    affiliationsHistory: text('affiliations_history').notNull(),
    logoInitials: text('logo_initials').notNull(),
    brandColor: text('brand_color').notNull().default('#0F294A'),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    isDemoData: boolean('is_demo_data').notNull().default(true),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('political_parties_abbrev_idx').on(table.abbreviation)],
);

export const politicians = pgTable(
  'politicians',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    fullName: text('full_name').notNull(),
    honorific: text('honorific').notNull(),
    photoUrl: text('photo_url'),
    dateOfBirth: text('date_of_birth').notNull().default('Unavailable'),
    birthPlace: text('birth_place').notNull(),
    province: text('province').notNull(),
    education: text('education').notNull(),
    biography: text('biography').notNull(),
    currentPartyId: integer('current_party_id').references(() => politicalParties.id, {
      onDelete: 'set null',
    }),
    currentPositionTitle: text('current_position_title').notNull(),
    currentConstituencyCode: text('current_constituency_code').notNull(),
    businessInterestsSummary: text('business_interests_summary').notNull(),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isDemoData: boolean('is_demo_data').notNull().default(true),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('politicians_name_idx').on(table.fullName),
    index('politicians_province_idx').on(table.province),
    index('politicians_party_idx').on(table.currentPartyId),
  ],
);

export const partyMemberships = pgTable(
  'party_memberships',
  {
    id: serial('id').primaryKey(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    partyId: integer('party_id')
      .references(() => politicalParties.id, { onDelete: 'cascade' })
      .notNull(),
    roleInParty: text('role_in_party').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    isCurrent: boolean('is_current').notNull().default(false),
    notes: text('notes'),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('party_memberships_pol_idx').on(table.politicianId)],
);

export const politicalPositions = pgTable(
  'political_positions',
  {
    id: serial('id').primaryKey(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    institution: text('institution').notNull(),
    jurisdiction: text('jurisdiction').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    isCurrent: boolean('is_current').notNull().default(false),
    summary: text('summary').notNull(),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('political_positions_pol_idx').on(table.politicianId)],
);

export const elections = pgTable(
  'elections',
  {
    id: serial('id').primaryKey(),
    year: integer('year').notNull(),
    title: text('title').notNull(),
    electionType: text('election_type').notNull(),
    electionDate: text('election_date').notNull(),
    officialSourceUrl: text('official_source_url').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('elections_year_idx').on(table.year)],
);

export const constituencies = pgTable(
  'constituencies',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    province: text('province').notNull(),
    district: text('district').notNull(),
    assemblyType: text('assembly_type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('constituencies_province_idx').on(table.province)],
);

export const electionResults = pgTable(
  'election_results',
  {
    id: serial('id').primaryKey(),
    electionId: integer('election_id')
      .references(() => elections.id, { onDelete: 'cascade' })
      .notNull(),
    constituencyId: integer('constituency_id')
      .references(() => constituencies.id, { onDelete: 'cascade' })
      .notNull(),
    politicianId: integer('politician_id').references(() => politicians.id, {
      onDelete: 'set null',
    }),
    candidateName: text('candidate_name').notNull(),
    partyId: integer('party_id').references(() => politicalParties.id, {
      onDelete: 'set null',
    }),
    partyAbbreviation: text('party_abbreviation').notNull(),
    votesReceived: integer('votes_received').notNull(),
    totalValidVotes: integer('total_valid_votes'),
    positionRank: integer('position_rank').notNull().default(1),
    isWinner: boolean('is_winner').notNull().default(false),
    winningCandidateName: text('winning_candidate_name').notNull(),
    resultStatus: text('result_status').notNull(),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    isDemoData: boolean('is_demo_data').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('election_results_pol_idx').on(table.politicianId),
    index('election_results_election_idx').on(table.electionId),
    index('election_results_constituency_idx').on(table.constituencyId),
  ],
);

export const assetDeclarations = pgTable(
  'asset_declarations',
  {
    id: serial('id').primaryKey(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    declarationYear: integer('declaration_year').notNull(),
    fiscalYearLabel: text('fiscal_year_label').notNull(),
    currency: text('currency').notNull().default('PKR'),
    totalDeclaredAssets: text('total_declared_assets').notNull(),
    totalDeclaredLiabilities: text('total_declared_liabilities').notNull(),
    netDeclaredSummary: text('net_declared_summary').notNull(),
    filingAuthority: text('filing_authority')
      .notNull()
      .default('Election Commission of Pakistan (ECP)'),
    verificationStatus: text('verification_status')
      .notNull()
      .default('Reported, not independently verified'),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    isDemoData: boolean('is_demo_data').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('asset_declarations_pol_idx').on(table.politicianId),
    index('asset_declarations_year_idx').on(table.declarationYear),
  ],
);

export const assets = pgTable(
  'assets',
  {
    id: serial('id').primaryKey(),
    declarationId: integer('declaration_id')
      .references(() => assetDeclarations.id, { onDelete: 'cascade' })
      .notNull(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    locationOrInstitution: text('location_or_institution').notNull(),
    declaredValue: text('declared_value').notNull(),
    currency: text('currency').notNull().default('PKR'),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('assets_decl_idx').on(table.declarationId)],
);

export const liabilities = pgTable(
  'liabilities',
  {
    id: serial('id').primaryKey(),
    declarationId: integer('declaration_id')
      .references(() => assetDeclarations.id, { onDelete: 'cascade' })
      .notNull(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    creditorOrType: text('creditor_or_type').notNull(),
    description: text('description').notNull(),
    amount: text('amount').notNull(),
    currency: text('currency').notNull().default('PKR'),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('liabilities_decl_idx').on(table.declarationId)],
);

export const parliamentaryRecords = pgTable(
  'parliamentary_records',
  {
    id: serial('id').primaryKey(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    termLabel: text('term_label').notNull(),
    assemblyName: text('assembly_name').notNull(),
    sessionsAttended: integer('sessions_attended').notNull(),
    totalSessions: integer('total_sessions').notNull(),
    questionsSubmitted: integer('questions_submitted').notNull(),
    billsIntroduced: integer('bills_introduced').notNull(),
    speechesDelivered: integer('speeches_delivered').notNull(),
    votingParticipationPct: integer('voting_participation_pct').notNull(),
    committeeMemberships: text('committee_memberships').notNull(),
    notableActivitySummary: text('notable_activity_summary').notNull(),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    isDemoData: boolean('is_demo_data').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('parliamentary_records_pol_idx').on(table.politicianId)],
);

export const familyRelationships = pgTable(
  'family_relationships',
  {
    id: serial('id').primaryKey(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    relativeName: text('relative_name').notNull(),
    relationshipType: text('relationship_type').notNull(),
    publicRoleOrAffiliation: text('public_role_or_affiliation').notNull(),
    verificationStatus: text('verification_status').notNull().default('Officially documented'),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('family_relationships_pol_idx').on(table.politicianId)],
);

export const newsAndStatements = pgTable(
  'news_and_statements',
  {
    id: serial('id').primaryKey(),
    politicianId: integer('politician_id')
      .references(() => politicians.id, { onDelete: 'cascade' })
      .notNull(),
    headline: text('headline').notNull(),
    statementOrSummary: text('statement_or_summary').notNull(),
    publishedDate: text('published_date').notNull(),
    publisher: text('publisher').notNull(),
    url: text('url').notNull(),
    verificationStatus: text('verification_status')
      .notNull()
      .default('Independently corroborated'),
    isDemoData: boolean('is_demo_data').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('news_statements_pol_idx').on(table.politicianId)],
);

export const verificationRecords = pgTable(
  'verification_records',
  {
    id: serial('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    fieldOrSection: text('field_or_section').notNull(),
    claimSummary: text('claim_summary').notNull(),
    status: text('status').notNull(),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    reviewedByUid: text('reviewed_by_uid'),
    reviewedByEmail: text('reviewed_by_email'),
    reviewerNotes: text('reviewer_notes'),
    verifiedAt: timestamp('verified_at').defaultNow().notNull(),
  },
  (table) => [index('verification_entity_idx').on(table.entityType, table.entityId)],
);

export const correctionRequests = pgTable(
  'correction_requests',
  {
    id: serial('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    entityLabel: text('entity_label').notNull(),
    sectionName: text('section_name').notNull(),
    submittedClaim: text('submitted_claim').notNull(),
    suggestedCorrection: text('suggested_correction').notNull(),
    evidenceUrl: text('evidence_url'),
    submitterName: text('submitter_name').notNull(),
    submitterEmail: text('submitter_email').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'resolved'
    adminNotes: text('admin_notes'),
    reviewedByUid: text('reviewed_by_uid'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('correction_status_idx').on(table.status)],
);

export const politicalPartiesRelations = relations(politicalParties, ({ many, one }) => ({
  politicians: many(politicians),
  memberships: many(partyMemberships),
  source: one(sources, {
    fields: [politicalParties.sourceId],
    references: [sources.id],
  }),
}));

export const politiciansRelations = relations(politicians, ({ one, many }) => ({
  currentParty: one(politicalParties, {
    fields: [politicians.currentPartyId],
    references: [politicalParties.id],
  }),
  partyMemberships: many(partyMemberships),
  positions: many(politicalPositions),
  electionResults: many(electionResults),
  assetDeclarations: many(assetDeclarations),
  parliamentaryRecords: many(parliamentaryRecords),
  familyRelationships: many(familyRelationships),
  newsAndStatements: many(newsAndStatements),
}));
