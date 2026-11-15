import { useMemo, useState } from 'react';
import { ArrowUpRight, Flag } from 'lucide-react';
import type { AppSection } from './PlatformHeader';
import { VerificationLabel } from './VerificationLabel';
import { CorrectionModal } from './CorrectionModal';

export interface FinancialRecordItem {
  id: number;
  politicianId: number;
  politicianName: string;
  politicianSlug: string;
  province: string;
  declarationYear: number;
  fiscalYearLabel: string;
  currency: string;
  totalDeclaredAssets: string;
  totalDeclaredLiabilities: string;
  netDeclaredSummary: string;
  filingAuthority: string;
  verificationStatus: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
  isDemoData: boolean;
  assets: Array<{
    id: number;
    category: string;
    description: string;
    locationOrInstitution: string;
    declaredValue: string;
    currency: string;
  }>;
  liabilities: Array<{
    id: number;
    creditorOrType: string;
    description: string;
    amount: string;
    currency: string;
  }>;
}

export interface ParliamentaryRecordItem {
  id: number;
  politicianId: number;
  politicianName: string;
  politicianSlug: string;
  province: string;
  termLabel: string;
  assemblyName: string;
  sessionsAttended: number;
  totalSessions: number;
  questionsSubmitted: number;
  billsIntroduced: number;
  speechesDelivered: number;
  votingParticipationPct: number;
  committeeMemberships: string;
  notableActivitySummary: string;
  verificationStatus: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
  isDemoData: boolean;
}

export interface SourcesPayload {
  sources: Array<{
    id: number;
    title: string;
    url: string;
    publisher: string;
    publicationDate: string;
    dateCollected: string;
    lastUpdatedAt: string;
    verificationStatus: string;
    notes: string | null;
  }>;
  verifications: Array<{
    id: number;
    entityType: string;
    entityId: number;
    fieldOrSection: string;
    claimSummary: string;
    status: string;
    reviewerNotes: string | null;
    verifiedAt: string;
  }>;
}

interface TransparencyHubProps {
  activeTab: 'financials' | 'parliament' | 'sources';
  financials: FinancialRecordItem[];
  parliament: ParliamentaryRecordItem[];
  sourcesData: SourcesPayload | null;
  isLoading: boolean;
  onChangeTab: (tab: AppSection) => void;
  onOpenPolitician: (slug: string) => void;
}

export function TransparencyHub({
  activeTab,
  financials,
  parliament,
  sourcesData,
  isLoading,
  onChangeTab,
  onOpenPolitician,
}: TransparencyHubProps) {
  const [selectedPoliticianFilter, setSelectedPoliticianFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [correctionTarget, setCorrectionTarget] = useState<{
    entityType: string;
    entityId: number;
    entityLabel: string;
    section: string;
  } | null>(null);

  const financialPoliticians = useMemo(
    () => Array.from(new Set(financials.map((f) => f.politicianName))).sort(),
    [financials],
  );

  const filteredFinancials = useMemo(() => {
    if (selectedPoliticianFilter === 'All') return financials;
    return financials.filter((f) => f.politicianName === selectedPoliticianFilter);
  }, [financials, selectedPoliticianFilter]);

  const filteredSources = useMemo(() => {
    const list = sourcesData?.sources ?? [];
    if (statusFilter === 'All') return list;
    return list.filter((s) => s.verificationStatus === statusFilter);
  }, [sourcesData, statusFilter]);

  const tabs: Array<{ id: AppSection; label: string }> = [
    { id: 'financials', label: 'Assets & Financial Disclosures' },
    { id: 'parliament', label: 'Parliamentary Performance' },
    { id: 'sources', label: 'Sources & Verification' },
    { id: 'live-lookup', label: 'Live Web Lookup' },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
          Public Accountability &amp; Citation Standards
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-[#0F294A] dark:text-white">
          Financial, Parliamentary &amp; Verification Transparency
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Inspect annual ECP Form-B asset schedules, legislative performance records, and
          documentary verification statuses across all indexed records.
        </p>

        <div
          role="tablist"
          aria-label="Transparency sections"
          className="mt-6 flex flex-wrap gap-2"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeTab(tab.id)}
                className={`min-h-[40px] rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'border-[#0F294A] bg-[#0F294A] text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 h-56 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ) : activeTab === 'financials' ? (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Declared Assets vs. Independent Verification
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                PakPolitico never estimates or fabricates net worth. Every entry lists the filing
                authority, declaration year, currency, and verification status. Entries marked
                &ldquo;Demo Sample&rdquo; are illustrative placeholders for platform demonstration.
              </p>
            </div>
            <div className="shrink-0">
              <label
                htmlFor="fin-pol-filter"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Filter by Politician
              </label>
              <select
                id="fin-pol-filter"
                value={selectedPoliticianFilter}
                onChange={(e) => setSelectedPoliticianFilter(e.target.value)}
                className="mt-1 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All Politicians</option>
                {financialPoliticians.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Historical Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th scope="col" className="px-4 py-3">Politician</th>
                  <th scope="col" className="px-4 py-3">Year / Filing</th>
                  <th scope="col" className="px-4 py-3">Declared Assets</th>
                  <th scope="col" className="px-4 py-3">Liabilities</th>
                  <th scope="col" className="px-4 py-3">Currency</th>
                  <th scope="col" className="px-4 py-3">Status &amp; Source</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFinancials.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => onOpenPolitician(f.politicianSlug)}
                        className="font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                      >
                        {f.politicianName}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{f.province}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums dark:text-white">
                        {f.declarationYear}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {f.fiscalYearLabel}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                      {f.totalDeclaredAssets}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                      {f.totalDeclaredLiabilities}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {f.currency}
                    </td>
                    <td className="px-4 py-3.5">
                      <VerificationLabel status={f.verificationStatus} compact />
                      {f.sourceUrl && (
                        <a
                          href={f.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-600 hover:underline dark:text-slate-400"
                        >
                          <span>{f.filingAuthority}</span>
                          <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCorrectionTarget({
                            entityType: 'asset_declaration',
                            entityId: f.id,
                            entityLabel: `${f.politicianName} (${f.declarationYear})`,
                            section: 'Asset Declaration',
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#0F294A] dark:text-slate-400 dark:hover:text-white"
                      >
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        <span>Flag</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Itemized Properties & Business Schedules */}
          <div className="grid gap-5 md:grid-cols-2">
            {filteredFinancials
              .filter((f) => f.assets.length > 0 || f.liabilities.length > 0)
              .map((f) => (
                <article
                  key={`detail-${f.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h3 className="font-display text-lg font-semibold text-[#0F294A] dark:text-white">
                      {f.politicianName} — {f.declarationYear} Breakdown
                    </h3>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {f.currency}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {f.netDeclaredSummary}
                  </p>
                  {f.assets.length > 0 && (
                    <ul className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                      {f.assets.map((a) => (
                        <li key={a.id} className="py-2.5">
                          <div className="flex justify-between gap-2 font-semibold text-slate-900 dark:text-slate-100">
                            <span>{a.category}</span>
                            <span className="font-mono tabular-nums">{a.declaredValue}</span>
                          </div>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                            {a.description} · {a.locationOrInstitution}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {f.liabilities.length > 0 && (
                    <ul className="mt-3 border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
                      {f.liabilities.map((l) => (
                        <li key={l.id} className="flex justify-between gap-2 py-1">
                          <span className="text-slate-600 dark:text-slate-300">
                            Liability: {l.creditorOrType}
                          </span>
                          <span className="font-mono font-medium text-slate-900 tabular-nums dark:text-white">
                            {l.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
          </div>
        </div>
      ) : activeTab === 'parliament' ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {parliament.map((pr) => {
              const attendancePct = Math.round(
                (pr.sessionsAttended / Math.max(1, pr.totalSessions)) * 100,
              );
              return (
                <article
                  key={pr.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {pr.assemblyName} · {pr.termLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenPolitician(pr.politicianSlug)}
                        className="mt-1 font-display text-xl font-semibold text-[#0F294A] hover:underline dark:text-white"
                      >
                        {pr.politicianName}
                      </button>
                    </div>
                    <VerificationLabel status={pr.verificationStatus} compact />
                  </div>

                  {/* Attendance Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        Session Attendance
                      </span>
                      <span className="font-mono font-semibold text-[#0F294A] tabular-nums dark:text-white">
                        {pr.sessionsAttended}/{pr.totalSessions} ({attendancePct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-[#14532D] dark:bg-emerald-500"
                        style={{ width: `${attendancePct}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-4 gap-3 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
                    <div>
                      <dt className="text-[11px] text-slate-500 dark:text-slate-400">Questions</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                        {pr.questionsSubmitted}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-slate-500 dark:text-slate-400">Bills</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                        {pr.billsIntroduced}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-slate-500 dark:text-slate-400">Speeches</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                        {pr.speechesDelivered}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-slate-500 dark:text-slate-400">Voting</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-[#14532D] tabular-nums dark:text-emerald-400">
                        {pr.votingParticipationPct}%
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Committees: </span>
                      {pr.committeeMemberships}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {pr.notableActivitySummary}
                    </p>
                    {pr.sourceUrl && (
                      <a
                        href={pr.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 pt-1 font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                      >
                        <span>{pr.sourceTitle ?? 'Parliamentary Archive'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Verification Taxonomy &amp; Source Registry
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Every claim is classified as Officially documented, Independently corroborated,
                Reported (not independently verified), Disputed, or Unavailable.
              </p>
            </div>

            <div>
              <label
                htmlFor="src-status-filter"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Filter by Verification Status
              </label>
              <select
                id="src-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All Statuses</option>
                <option value="Officially documented">Officially documented</option>
                <option value="Independently corroborated">Independently corroborated</option>
                <option value="Reported, not independently verified">
                  Reported, not independently verified
                </option>
                <option value="Disputed">Disputed</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th scope="col" className="px-4 py-3">Source Title</th>
                  <th scope="col" className="px-4 py-3">Publisher</th>
                  <th scope="col" className="px-4 py-3">Published</th>
                  <th scope="col" className="px-4 py-3">Collected / Updated</th>
                  <th scope="col" className="px-4 py-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSources.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3.5">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                      >
                        <span>{s.title}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                      {s.notes && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                      {s.publisher}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                      {s.publicationDate}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                      {s.dateCollected} / {s.lastUpdatedAt}
                    </td>
                    <td className="px-4 py-3.5">
                      <VerificationLabel status={s.verificationStatus} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sourcesData && sourcesData.verifications.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-lg font-semibold text-[#0F294A] dark:text-white">
                Recent Editorial Verification Audit Log
              </h3>
              <ul className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {sourcesData.verifications.map((v) => (
                  <li key={v.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {v.fieldOrSection} ({v.entityType} #{v.entityId})
                      </p>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">{v.claimSummary}</p>
                      {v.reviewerNotes && (
                        <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                          Note: {v.reviewerNotes}
                        </p>
                      )}
                    </div>
                    <VerificationLabel status={v.status} compact />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {correctionTarget && (
        <CorrectionModal
          isOpen
          entityType={correctionTarget.entityType}
          entityId={correctionTarget.entityId}
          entityLabel={correctionTarget.entityLabel}
          defaultSection={correctionTarget.section}
          onClose={() => setCorrectionTarget(null)}
        />
      )}
    </section>
  );
}
