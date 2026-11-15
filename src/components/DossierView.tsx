import { motion } from 'motion/react';
import { ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { FEATURED_LEADERS } from '../data/featuredLeaders';
import type { PoliticianDossier } from '../types/politician';

interface DossierViewProps {
  dossier: PoliticianDossier | null;
  isLoading: boolean;
  loadingName: string | null;
  errorMessage: string | null;
  lastSearchedName: string | null;
  onSelectLeader: (name: string) => void;
  onRetry: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatRetrievedDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recent search';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DossierView({
  dossier,
  isLoading,
  loadingName,
  errorMessage,
  lastSearchedName,
  onSelectLeader,
  onRetry,
}: DossierViewProps) {
  if (isLoading) {
    return (
      <section
        id="dossier-view"
        aria-busy="true"
        aria-live="polite"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12"
      >
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8 dark:border-slate-800">
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              Retrieving public records via Google Search grounding
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#0F294A] sm:text-3xl dark:text-white">
              Compiling dossier for {loadingName || 'requested leader'}...
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Cross-referencing party affiliation, Election Commission constituency filings,
              parliamentary positions, and asset disclosures.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
            {[
              '01. Full Name & Political Party',
              '02. Constituency & Electoral History',
              '03. Key Public Positions & Parliamentary Roles',
              '04. Asset Declarations & Financial Disclosures',
            ].map((label) => (
              <div key={label} className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section
        id="dossier-view"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12"
      >
        <div
          role="alert"
          className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Public Record Lookup Notice</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#0F294A] dark:text-white">
                {lastSearchedName
                  ? `Could not complete dossier for "${lastSearchedName}"`
                  : 'Unable to complete lookup'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {errorMessage}
              </p>
            </div>

            {lastSearchedName && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#0F294A] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (!dossier) {
    return (
      <section
        id="dossier-view"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12"
      >
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
                Structured Public-Record Dossier Format
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#0F294A] dark:text-white">
                Select a leader or search any Pakistani politician above
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectLeader(FEATURED_LEADERS[0].name)}
              className="min-h-[44px] rounded-lg border border-[#14532D] bg-white px-4 py-2 text-sm font-medium text-[#14532D] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#14532D] hover:text-white focus-visible:outline-2 focus-visible:outline-[#14532D] dark:border-emerald-500 dark:bg-slate-950 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
            >
              Inspect {FEATURED_LEADERS[0].name}
            </button>
          </div>

          <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800">
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              <div className="p-6 sm:p-8">
                <p className="font-mono text-xs font-medium text-[#14532D] dark:text-emerald-400">01</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Full Name &amp; Political Party
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Verified legal name, party affiliation, leadership standing, home province, and a
                  concise non-partisan career summary.
                </p>
              </div>
              <div className="p-6 sm:p-8">
                <p className="font-mono text-xs font-medium text-[#14532D] dark:text-emerald-400">02</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Constituency &amp; Electoral History
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  National Assembly (NA), Provincial Assembly (PP/PS/PK/PB), and Senate contests
                  with constituency codes, outcomes, and reported vote tallies.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              <div className="p-6 sm:p-8">
                <p className="font-mono text-xs font-medium text-[#14532D] dark:text-emerald-400">03</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Key Public Positions &amp; Parliamentary Roles
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Cabinet portfolios, executive mandates, speaker or opposition roles, and notable
                  parliamentary committee service.
                </p>
              </div>
              <div className="p-6 sm:p-8">
                <p className="font-mono text-xs font-medium text-[#14532D] dark:text-emerald-400">04</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Asset Declarations &amp; Financial Disclosures
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Summaries of Election Commission of Pakistan (ECP) Form-B asset filings, real
                  estate, equity holdings, and cited press disclosures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="dossier-view"
      aria-label={`Public record dossier for ${dossier.fullName}`}
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12"
    >
      <motion.article
        key={dossier.fullName}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        {/* 1) Full Name & Political Party */}
        <section
          aria-labelledby="section-identity-heading"
          className="border-b border-slate-200 bg-slate-50/70 px-6 py-8 sm:px-8 lg:px-10 dark:border-slate-800 dark:bg-slate-950/60"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-300 bg-white text-[#0F294A] sm:h-20 sm:w-20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                  {getInitials(dossier.fullName)}
                </span>
                <span className="font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {dossier.partyAbbreviation}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
                  <span>01. Full Name &amp; Political Party</span>
                  <span aria-hidden="true" className="mx-2 text-slate-400">
                    ·
                  </span>
                  <span className="font-mono text-[#14532D] dark:text-emerald-400">
                    {dossier.partyAbbreviation}
                  </span>
                  <span aria-hidden="true" className="mx-2 text-slate-400">
                    ·
                  </span>
                  <span>{dossier.homeBase}</span>
                </p>

                <h2
                  id="section-identity-heading"
                  className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#0F294A] text-balance sm:text-4xl dark:text-white"
                >
                  {dossier.fullName}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-[#14532D] dark:text-emerald-400">
                  <span>{dossier.politicalParty}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {dossier.honorificOrTitle}
                  </span>
                </div>

                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {dossier.biographySummary}
                </p>
              </div>
            </div>

            <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-200 pt-4 text-sm lg:w-72 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-slate-800">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Standing</dt>
                <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{dossier.currentStatus}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Primary Constituency</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-slate-900 tabular-nums dark:text-white">
                  {dossier.currentOrLastConstituency}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Grounded Retrieval</dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                  {formatRetrievedDate(dossier.retrievedAt)} · {dossier.sources.length} sources
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 2) Constituency & Electoral History */}
        <section
          aria-labelledby="section-electoral-heading"
          className="border-b border-slate-200 px-6 py-8 sm:px-8 lg:px-10 dark:border-slate-800"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
                02. Constituency &amp; Electoral History
              </p>
              <h3
                id="section-electoral-heading"
                className="mt-1 font-display text-2xl font-semibold text-[#0F294A] dark:text-white"
              >
                Electoral Record &amp; Constituencies
              </h3>
            </div>
            <p className="font-mono text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
              Focus seat: {dossier.currentOrLastConstituency}
            </p>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {dossier.electoralOverview}
          </p>

          {dossier.electoralHistory.length > 0 ? (
            <>
              <div className="mt-6 hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th scope="col" className="py-3 pr-4">Year</th>
                      <th scope="col" className="py-3 pr-4">Constituency</th>
                      <th scope="col" className="py-3 pr-4">Assembly</th>
                      <th scope="col" className="py-3 pr-4">Outcome</th>
                      <th scope="col" className="py-3">Vote Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dossier.electoralHistory.map((row, idx) => (
                      <tr key={`${row.electionYear}-${row.constituency}-${idx}`}>
                        <td className="py-3.5 pr-4 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap dark:text-white">
                          {row.electionYear}
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs font-medium text-slate-900 sm:text-sm dark:text-slate-100">
                          {row.constituency}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-600 dark:text-slate-300">{row.assembly}</td>
                        <td className="py-3.5 pr-4 font-medium text-[#14532D] whitespace-nowrap dark:text-emerald-400">
                          {row.outcome}
                        </td>
                        <td className="py-3.5 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-400">
                          {row.voteSummary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200 md:hidden dark:divide-slate-800 dark:border-slate-800">
                {dossier.electoralHistory.map((row, idx) => (
                  <div
                    key={`${row.electionYear}-${row.constituency}-m-${idx}`}
                    className="py-4 text-sm"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums dark:text-white">
                        {row.electionYear} · {row.constituency}
                      </span>
                      <span className="font-medium text-[#14532D] whitespace-nowrap dark:text-emerald-400">
                        {row.outcome}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{row.assembly}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {row.voteSummary}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Detailed constituency-by-constituency election table was not itemized in returned
              records.
            </p>
          )}
        </section>

        {/* 3) Key Public Positions & Parliamentary Roles */}
        <section
          aria-labelledby="section-positions-heading"
          className="border-b border-slate-200 px-6 py-8 sm:px-8 lg:px-10 dark:border-slate-800"
        >
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
                03. Key Public Positions &amp; Parliamentary Roles
              </p>
              <h3
                id="section-positions-heading"
                className="mt-1 font-display text-2xl font-semibold text-[#0F294A] dark:text-white"
              >
                Executive &amp; Legislative Service
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {dossier.parliamentaryRolesSummary}
              </p>

              {dossier.parliamentaryContributions.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <h4 className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
                    Notable Parliamentary &amp; Policy Milestones
                  </h4>
                  <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {dossier.parliamentaryContributions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#14532D] dark:bg-emerald-400"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-200 border-t border-slate-200 lg:col-span-8 lg:border-t-0 lg:border-l lg:pl-8 dark:divide-slate-800 dark:border-slate-800">
              {dossier.positions.length > 0 ? (
                dossier.positions.map((pos, idx) => (
                  <div
                    key={`${pos.title}-${idx}`}
                    className={idx === 0 ? 'pb-5 pt-5 lg:pt-0' : 'py-5'}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <h4 className="text-base font-semibold text-[#0F294A] dark:text-white">
                        {pos.title}
                      </h4>
                      <span className="font-mono text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap dark:text-slate-400">
                        {pos.tenure}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#14532D] dark:text-emerald-400">
                      {pos.institution}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {pos.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                  No individual office tenures were itemized in returned records.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 4) Asset Declarations & Financial Disclosures */}
        <section
          aria-labelledby="section-assets-heading"
          className="border-b border-slate-200 bg-slate-50/50 px-6 py-8 sm:px-8 lg:px-10 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
                04. Publicly Documented Asset Declarations &amp; Financial Disclosures
              </p>
              <h3
                id="section-assets-heading"
                className="mt-1 font-display text-2xl font-semibold text-[#0F294A] dark:text-white"
              >
                Financial Disclosures &amp; ECP Form-B Filings
              </h3>
            </div>
            <p className="font-mono text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
              Filing reference: {dossier.filingYear}
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Headline Public Disclosure Summary
            </p>
            <p className="mt-1.5 font-display text-lg font-medium text-[#0F294A] sm:text-xl dark:text-white">
              {dossier.declaredNetWorthSummary}
            </p>
          </div>

          {dossier.assetCategories.length > 0 && (
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {dossier.assetCategories.map((asset, idx) => (
                <div
                  key={`${asset.category}-${idx}`}
                  className="border-t border-slate-200 pt-4 dark:border-slate-800"
                >
                  <dt className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {asset.category}
                    </span>
                    <span className="font-mono text-xs font-medium text-[#14532D] tabular-nums text-right dark:text-emerald-400">
                      {asset.reportedValue}
                    </span>
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {asset.details}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Disclosure Note: </span>
            {dossier.financialDisclosuresNotes}
          </p>
        </section>

        {/* Grounded Sources Rail */}
        <section
          id="dossier-sources"
          aria-labelledby="section-sources-heading"
          className="bg-slate-50 px-6 py-6 sm:px-8 lg:px-10 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h3
              id="section-sources-heading"
              className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300"
            >
              Verified Google Search Grounding Sources ({dossier.sources.length})
            </h3>
            {dossier.searchQueries.length > 0 && (
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Queries: {dossier.searchQueries.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>

          {dossier.sources.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dossier.sources.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5 text-left transition-colors duration-150 hover:border-[#0F294A]/50 focus-visible:outline-2 focus-visible:outline-[#0F294A] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-[#0F294A] dark:text-white dark:group-hover:text-sky-400">
                        {src.title}
                      </p>
                      <p className="mt-1 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {src.domain}
                      </p>
                    </div>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0F294A] dark:group-hover:text-sky-400"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Search grounding was used during synthesis; no external citation links were returned
              for this query.
            </p>
          )}
        </section>
      </motion.article>
    </section>
  );
}
