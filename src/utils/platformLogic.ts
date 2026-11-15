export type VerificationStatus =
  | 'Officially documented'
  | 'Independently corroborated'
  | 'Reported, not independently verified'
  | 'Disputed'
  | 'Unavailable';

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Officially documented',
  'Independently corroborated',
  'Reported, not independently verified',
  'Disputed',
  'Unavailable',
];

export const PROVINCES = [
  'All Provinces',
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
] as const;

export interface SearchFilterParams {
  query: string;
  province: string;
  party: string;
  position: string;
  constituency: string;
  electionYear: string;
  sortBy: 'name_asc' | 'name_desc' | 'updated_desc' | 'province_asc';
  page: number;
  pageSize: number;
}

export interface PoliticianDirectoryItem {
  id: number;
  slug: string;
  fullName: string;
  honorific: string;
  photoUrl: string | null;
  province: string;
  currentPositionTitle: string;
  currentConstituencyCode: string;
  partyName: string;
  partyAbbreviation: string;
  verificationStatus: string;
  isFeatured: boolean;
  isDemoData: boolean;
  isPublished: boolean;
  electionYears: number[];
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  category: 'Position' | 'Party' | 'Election' | 'Disclosure';
  title: string;
  subtitle: string;
  verificationStatus: string;
}

export function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function filterAndPaginatePoliticians(
  items: PoliticianDirectoryItem[],
  params: SearchFilterParams,
): {
  items: PoliticianDirectoryItem[];
  total: number;
  page: number;
  totalPages: number;
} {
  const q = params.query.trim().toLowerCase();
  const prov = params.province.trim().toLowerCase();
  const party = params.party.trim().toLowerCase();
  const pos = params.position.trim().toLowerCase();
  const constCode = params.constituency.trim().toLowerCase();
  const yearNum = params.electionYear ? Number(params.electionYear) : NaN;

  const filtered = items.filter((item) => {
    if (q) {
      const hay =
        `${item.fullName} ${item.partyName} ${item.partyAbbreviation} ${item.currentPositionTitle} ${item.currentConstituencyCode} ${item.province}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (prov && prov !== 'all provinces' && item.province.toLowerCase() !== prov) {
      return false;
    }

    if (
      party &&
      party !== 'all' &&
      item.partyAbbreviation.toLowerCase() !== party &&
      item.partyName.toLowerCase() !== party
    ) {
      return false;
    }

    if (pos && !item.currentPositionTitle.toLowerCase().includes(pos)) {
      return false;
    }

    if (constCode && !item.currentConstituencyCode.toLowerCase().includes(constCode)) {
      return false;
    }

    if (!Number.isNaN(yearNum) && !item.electionYears.includes(yearNum)) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (params.sortBy) {
      case 'name_desc':
        return b.fullName.localeCompare(a.fullName);
      case 'province_asc':
        return (
          a.province.localeCompare(b.province) ||
          a.fullName.localeCompare(b.fullName)
        );
      case 'updated_desc':
        return b.updatedAt.localeCompare(a.updatedAt);
      case 'name_asc':
      default:
        return a.fullName.localeCompare(b.fullName);
    }
  });

  const safePageSize = Math.max(1, Math.min(50, params.pageSize));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.max(1, Math.min(totalPages, params.page));
  const start = (safePage - 1) * safePageSize;

  return {
    items: sorted.slice(start, start + safePageSize),
    total,
    page: safePage,
    totalPages,
  };
}

export function buildCareerTimeline(input: {
  positions: Array<{
    id: number;
    title: string;
    institution: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    verificationStatus: string;
  }>;
  memberships: Array<{
    id: number;
    partyName: string;
    roleInParty: string;
    startDate: string;
    endDate: string | null;
    verificationStatus: string;
  }>;
  elections: Array<{
    id: number;
    year: number;
    constituencyCode: string;
    resultStatus: string;
    votesReceived: number;
    verificationStatus: string;
  }>;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const pos of input.positions) {
    events.push({
      id: `pos-${pos.id}`,
      year: pos.startDate,
      category: 'Position',
      title: pos.title,
      subtitle: `${pos.institution} (${pos.startDate} – ${pos.isCurrent ? 'Present' : pos.endDate ?? 'Completed'})`,
      verificationStatus: pos.verificationStatus,
    });
  }

  for (const mem of input.memberships) {
    events.push({
      id: `mem-${mem.id}`,
      year: mem.startDate,
      category: 'Party',
      title: `${mem.roleInParty} — ${mem.partyName}`,
      subtitle: `${mem.startDate} – ${mem.endDate ?? 'Present'}`,
      verificationStatus: mem.verificationStatus,
    });
  }

  for (const el of input.elections) {
    events.push({
      id: `el-${el.id}`,
      year: String(el.year),
      category: 'Election',
      title: `${el.year} Election · ${el.constituencyCode} (${el.resultStatus})`,
      subtitle: `${el.votesReceived.toLocaleString('en-US')} recorded votes`,
      verificationStatus: el.verificationStatus,
    });
  }

  return events.sort((a, b) => b.year.localeCompare(a.year));
}

export function validateCorrectionInput(payload: {
  entityType?: unknown;
  entityId?: unknown;
  entityLabel?: unknown;
  sectionName?: unknown;
  submittedClaim?: unknown;
  suggestedCorrection?: unknown;
  evidenceUrl?: unknown;
  submitterName?: unknown;
  submitterEmail?: unknown;
}): { valid: true } | { valid: false; error: string } {
  const reqStr = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

  if (!reqStr(payload.entityType) || typeof payload.entityId !== 'number') {
    return { valid: false, error: 'Target record reference is required.' };
  }
  if (!reqStr(payload.sectionName)) {
    return { valid: false, error: 'Please select which record section needs correction.' };
  }
  if (!reqStr(payload.submittedClaim) || (payload.submittedClaim as string).trim().length < 5) {
    return { valid: false, error: 'Please describe the existing statement to be reviewed.' };
  }
  if (
    !reqStr(payload.suggestedCorrection) ||
    (payload.suggestedCorrection as string).trim().length < 10
  ) {
    return {
      valid: false,
      error: 'Please provide a clear suggested correction (at least 10 characters).',
    };
  }
  if (!reqStr(payload.submitterName)) {
    return { valid: false, error: 'Your name is required for editorial attribution.' };
  }
  if (
    !reqStr(payload.submitterEmail) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((payload.submitterEmail as string).trim())
  ) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  if (reqStr(payload.evidenceUrl)) {
    const url = (payload.evidenceUrl as string).trim();
    if (!/^https?:\/\//i.test(url)) {
      return { valid: false, error: 'Evidence URL must start with http:// or https://.' };
    }
  }

  return { valid: true };
}
