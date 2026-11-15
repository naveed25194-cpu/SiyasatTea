export interface ElectoralRecord {
  electionYear: string;
  constituency: string;
  assembly: string;
  outcome: string;
  voteSummary: string;
}

export interface PublicPosition {
  title: string;
  tenure: string;
  institution: string;
  description: string;
}

export interface AssetCategory {
  category: string;
  details: string;
  reportedValue: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  domain: string;
}

export interface PoliticianDossier {
  found: true;
  fullName: string;
  honorificOrTitle: string;
  politicalParty: string;
  partyAbbreviation: string;
  currentStatus: string;
  homeBase: string;
  biographySummary: string;
  currentOrLastConstituency: string;
  electoralOverview: string;
  electoralHistory: ElectoralRecord[];
  positions: PublicPosition[];
  parliamentaryRolesSummary: string;
  parliamentaryContributions: string[];
  declaredNetWorthSummary: string;
  filingYear: string;
  assetCategories: AssetCategory[];
  financialDisclosuresNotes: string;
  sources: GroundingSource[];
  searchQueries: string[];
  retrievedAt: string;
}

export interface DossierApiError {
  error: string;
  code?: string;
}

export interface FeaturedLeader {
  id: string;
  name: string;
  partyShort: string;
  roleLabel: string;
  primaryConstituency: string;
}
