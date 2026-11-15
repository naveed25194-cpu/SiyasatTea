import type {
  AssetCategory,
  ElectoralRecord,
  GroundingSource,
  PoliticianDossier,
  PublicPosition,
} from '../types/politician';

export interface QueryValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

export type DossierParseResult =
  | { ok: true; dossier: PoliticianDossier }
  | { ok: false; error: string; notFound?: boolean };

export function validateSearchQuery(rawQuery: unknown): QueryValidationResult {
  if (typeof rawQuery !== 'string') {
    return {
      valid: false,
      normalized: '',
      error: 'Please enter the name of a Pakistani politician to look up.',
    };
  }

  const normalized = rawQuery.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      error: 'Please enter the name of a Pakistani politician to look up.',
    };
  }

  if (normalized.length < 2) {
    return {
      valid: false,
      normalized,
      error: 'Search query must be at least 2 characters long.',
    };
  }

  if (normalized.length > 120) {
    return {
      valid: false,
      normalized: normalized.slice(0, 120),
      error: 'Search query must be 120 characters or fewer.',
    };
  }

  return { valid: true, normalized };
}

export function extractJsonObject(rawText: string): Record<string, unknown> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Empty response received from research service.');
  }

  // Strip optional markdown code fences first
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidateText = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    const direct = JSON.parse(candidateText);
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
      return direct as Record<string, unknown>;
    }
  } catch {
    // Fall through to balanced-brace extraction
  }

  const startIndex = candidateText.indexOf('{');
  if (startIndex === -1) {
    throw new Error('Structured profile payload was not found in model response.');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < candidateText.length; i += 1) {
    const ch = candidateText[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const slice = candidateText.slice(startIndex, i + 1);
        const parsed = JSON.parse(slice);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
        break;
      }
    }
  }

  throw new Error('Could not parse structured JSON object from model response.');
}

function asNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const cleaned = value.trim();
    if (cleaned.length > 0) {
      return cleaned;
    }
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function normalizeElectoralHistory(value: unknown): ElectoralRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      electionYear: asNonEmptyString(entry.electionYear, 'N/A'),
      constituency: asNonEmptyString(entry.constituency, 'Not specified'),
      assembly: asNonEmptyString(entry.assembly, 'Parliamentary'),
      outcome: asNonEmptyString(entry.outcome, 'Recorded'),
      voteSummary: asNonEmptyString(entry.voteSummary, 'Public tally not detailed'),
    }));
}

function normalizePositions(value: unknown): PublicPosition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      title: asNonEmptyString(entry.title, 'Public Office'),
      tenure: asNonEmptyString(entry.tenure, 'Dates not specified'),
      institution: asNonEmptyString(entry.institution, 'Government / Parliament of Pakistan'),
      description: asNonEmptyString(entry.description, 'Role documented in public records.'),
    }));
}

function normalizeAssetCategories(value: unknown): AssetCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      category: asNonEmptyString(entry.category, 'Declared Holding'),
      details: asNonEmptyString(entry.details, 'Documented in Election Commission filings.'),
      reportedValue: asNonEmptyString(entry.reportedValue, 'Value not itemized'),
    }));
}

export function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return 'source';
  }
}

export function extractGroundingSources(groundingChunks: unknown): GroundingSource[] {
  if (!Array.isArray(groundingChunks)) {
    return [];
  }

  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of groundingChunks) {
    if (!chunk || typeof chunk !== 'object') {
      continue;
    }

    const web = (chunk as { web?: unknown }).web;
    if (!web || typeof web !== 'object') {
      continue;
    }

    const uri = (web as { uri?: unknown }).uri;
    const title = (web as { title?: unknown }).title;

    if (typeof uri !== 'string') {
      continue;
    }

    const cleanUrl = uri.trim();
    if (!/^https?:\/\//i.test(cleanUrl) || seen.has(cleanUrl)) {
      continue;
    }

    seen.add(cleanUrl);
    const domain = extractDomainFromUrl(cleanUrl);
    const cleanTitle =
      typeof title === 'string' && title.trim().length > 0 ? title.trim() : domain;

    sources.push({
      title: cleanTitle,
      url: cleanUrl,
      domain,
    });
  }

  return sources;
}

export function parsePoliticianDossier(
  rawText: string,
  groundingChunks?: unknown,
  searchQueries?: unknown,
  retrievedAt: string = new Date().toISOString(),
): DossierParseResult {
  let rawObj: Record<string, unknown>;
  try {
    rawObj = extractJsonObject(rawText);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to parse structured dossier from search results.',
    };
  }

  if (rawObj.found === false) {
    return {
      ok: false,
      notFound: true,
      error: asNonEmptyString(
        rawObj.reason,
        'No verified Pakistani political record matched that query. Try a full name such as Imran Khan, Nawaz Sharif, or Bilawal Bhutto.',
      ),
    };
  }

  const fullName = asNonEmptyString(rawObj.fullName, '');
  if (!fullName) {
    return {
      ok: false,
      error: 'Returned profile did not contain a valid politician name.',
    };
  }

  const dossier: PoliticianDossier = {
    found: true,
    fullName,
    honorificOrTitle: asNonEmptyString(rawObj.honorificOrTitle, 'Pakistani Political Figure'),
    politicalParty: asNonEmptyString(rawObj.politicalParty, 'Independent / Affiliation not specified'),
    partyAbbreviation: asNonEmptyString(rawObj.partyAbbreviation, 'IND'),
    currentStatus: asNonEmptyString(rawObj.currentStatus, 'Public Record Active'),
    homeBase: asNonEmptyString(rawObj.homeBase, 'Pakistan'),
    biographySummary: asNonEmptyString(
      rawObj.biographySummary,
      'Public record compiled from parliamentary and electoral archives.',
    ),
    currentOrLastConstituency: asNonEmptyString(
      rawObj.currentOrLastConstituency,
      'Constituency record unavailable',
    ),
    electoralOverview: asNonEmptyString(
      rawObj.electoralOverview,
      'Electoral participation documented across Election Commission of Pakistan filings.',
    ),
    electoralHistory: normalizeElectoralHistory(rawObj.electoralHistory),
    positions: normalizePositions(rawObj.positions),
    parliamentaryRolesSummary: asNonEmptyString(
      rawObj.parliamentaryRolesSummary,
      'Parliamentary and executive roles documented in public archives.',
    ),
    parliamentaryContributions: asStringArray(rawObj.parliamentaryContributions),
    declaredNetWorthSummary: asNonEmptyString(
      rawObj.declaredNetWorthSummary,
      'Refer to Election Commission of Pakistan (ECP) Form-B asset statements.',
    ),
    filingYear: asNonEmptyString(rawObj.filingYear, 'Latest Public Disclosure'),
    assetCategories: normalizeAssetCategories(rawObj.assetCategories),
    financialDisclosuresNotes: asNonEmptyString(
      rawObj.financialDisclosuresNotes,
      'Figures reflect publicly reported ECP annual statements of assets and liabilities and media reporting on nomination filings.',
    ),
    sources: extractGroundingSources(groundingChunks),
    searchQueries: asStringArray(searchQueries),
    retrievedAt,
  };

  return { ok: true, dossier };
}
