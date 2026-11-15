import { useState, type FormEvent } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { AppSection } from './PlatformHeader';
import { VerificationLabel } from './VerificationLabel';

export interface OverviewPayload {
  stats: {
    politiciansCount: number;
    partiesCount: number;
    electionRecordsCount: number;
    assetDeclarationsCount: number;
    parliamentaryRecordsCount: number;
    verifiedSourcesCount: number;
  };
  featuredPoliticians: Array<{
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
    isDemoData: boolean;
  }>;
  recentlyAddedPoliticians: Array<{
    id: number;
    slug: string;
    fullName: string;
    province: string;
    currentPositionTitle: string;
    partyAbbreviation: string;
    verificationStatus: string;
  }>;
  parties: Array<{
    id: number;
    slug: string;
    name: string;
    abbreviation: string;
    foundedYear: number;
    currentLeadership: string;
    verificationStatus: string;
  }>;
  provinceBreakdown: Array<{
    province: string;
    count: number;
  }>;
  latestUpdates: Array<{
    id: number;
    title: string;
    detail: string;
    verificationStatus: string;
  }>;
  recentCorrectionsCount: number;
}

interface HomeOverviewProps {
  data: OverviewPayload | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSearchPolitician: (query: string) => void;
  onBrowseProvince: (province: string) => void;
  onBrowseParty: (partyAbbreviation: string) => void;
  onOpenPolitician: (slug: string) => void;
  onOpenParty: (slug: string) => void;
  onNavigate: (section: AppSection) => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return (parts[0] ?? 'PK').slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function HomeOverview({
  data,
  isLoading,
  error,
  onRetry,
  onSearchPolitician,
  onBrowseProvince,
  onBrowseParty,
  onOpenPolitician,
  onOpenParty,
  onNavigate,
}: HomeOverviewProps) {
  const [heroQuery, setHeroQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchPolitician(heroQuery.trim());
  };

  if (isLoading && !data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-14 w-full max-w-2xl animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div
          role="alert"
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Unable to load platform overview
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 min-h-[42px] rounded-lg bg-[#0F294A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A5F]"
          >
            Retry Loading
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {/* Hero & Search */}
      <section className="bg-white py-10 sm:py-14 dark:bg-[#0D1420]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
              Non-Partisan Public Information &amp; Parliamentary Archive
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#0F294A] text-balance sm:text-4xl lg:text-5xl dark:text-white">
              Pakistan political records, verified by source and citation.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Explore structured public profiles, party histories, constituency election tallies,
              annual asset declarations, and parliamentary participation across Pakistan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 max-w-3xl">
            <label htmlFor="home-politician-search" className="sr-only">
              Search any Pakistani politician
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="home-politician-search"
                  type="search"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Search any Pakistani politician..."
                  className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pr-4 pl-11 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#0F294A] focus:bg-white focus:outline-2 focus:outline-[#0F294A]/20 sm:text-base dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-sky-400"
                />
              </div>
              <button
                type="submit"
                className="min-h-[48px] rounded-lg bg-[#0F294A] px-6 py-3 text-sm font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#1E3A5F] dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                Search Directory
              </button>
              <button
                type="button"
                onClick={() => onNavigate('live-lookup')}
                className="min-h-[48px] rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Live Web Lookup
              </button>
            </div>
          </form>

          {/* 4-column Statistics Dashboard */}
          {data && (
            <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-200 pt-8 lg:grid-cols-4 dark:border-slate-800">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Politicians Profiled
                </dt>
                <dd className="mt-1.5 font-mono text-2xl font-semibold text-[#0F294A] tabular-nums dark:text-white">
                  {data.stats.politiciansCount}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Political Parties
                </dt>
                <dd className="mt-1.5 font-mono text-2xl font-semibold text-[#0F294A] tabular-nums dark:text-white">
                  {data.stats.partiesCount}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Financial &amp; Parliamentary Filings
                </dt>
                <dd className="mt-1.5 font-mono text-2xl font-semibold text-[#0F294A] tabular-nums dark:text-white">
                  {data.stats.assetDeclarationsCount + data.stats.parliamentaryRecordsCount}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Indexed Reference Sources
                </dt>
                <dd className="mt-1.5 font-mono text-2xl font-semibold text-[#14532D] tabular-nums dark:text-emerald-400">
                  {data.stats.verifiedSourcesCount}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* Featured Politicians */}
      {data && (
        <section className="bg-slate-50 py-10 sm:py-12 dark:bg-[#090E17]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#0F294A] dark:text-white">
                  Featured Politician Profiles
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Demonstration archive profiles clearly tagged with verification status and public
                  citations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('politicians')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F294A] hover:underline whitespace-nowrap shrink-0 dark:text-sky-400"
              >
                <span>View Full Directory</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.featuredPoliticians.map((pol) => (
                <article
                  key={pol.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-start gap-4">
                      {pol.photoUrl ? (
                        <img
                          src={pol.photoUrl}
                          alt={pol.fullName}
                          referrerPolicy="no-referrer"
                          className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[#0F294A] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          <span className="font-display text-base font-semibold">
                            {getInitials(pol.fullName)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {pol.partyAbbreviation}
                          </span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {pol.partyAbbreviation} · {pol.province} ·{' '}
                          <span className="font-mono tabular-nums">
                            {pol.currentConstituencyCode}
                          </span>
                        </p>
                        <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                          {pol.fullName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {pol.currentPositionTitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <VerificationLabel status={pol.verificationStatus} compact />
                    <button
                      type="button"
                      onClick={() => onOpenPolitician(pol.slug)}
                      className="min-h-[36px] rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#0F294A] whitespace-nowrap shrink-0 transition-colors hover:bg-[#0F294A] hover:text-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-100 dark:hover:text-slate-900"
                    >
                      Open Profile
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Province & Political Party + Parties Preview */}
      {data && (
        <section className="bg-white py-10 sm:py-12 dark:bg-[#0D1420]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="min-w-0 space-y-8 lg:col-span-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Browse by Province
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Filter documented representatives by provincial jurisdiction
                </p>
                <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {data.provinceBreakdown.map((item) => (
                    <button
                      key={item.province}
                      type="button"
                      onClick={() => onBrowseProvince(item.province)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {item.province}
                      </span>
                      <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {item.count} profiles
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Recently Updated Profiles
                </h2>
                <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {data.recentlyAddedPoliticians.map((pol) => (
                    <li key={pol.id}>
                      <button
                        type="button"
                        onClick={() => onOpenPolitician(pol.slug)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {pol.fullName}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {pol.partyAbbreviation} · {pol.currentPositionTitle}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#0F294A] whitespace-nowrap shrink-0 dark:text-sky-400">
                          View
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="min-w-0 space-y-8 lg:col-span-7">
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                    Political Parties Directory
                  </h2>
                  <button
                    type="button"
                    onClick={() => onNavigate('parties')}
                    className="text-xs font-semibold text-[#0F294A] hover:underline whitespace-nowrap dark:text-sky-400"
                  >
                    All Parties
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {data.parties.map((party) => (
                    <div
                      key={party.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-[#14532D] dark:text-emerald-400">
                            {party.abbreviation}
                          </span>
                          <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                            Est. {party.foundedYear}
                          </span>
                        </div>
                        <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-white">
                          {party.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                          {party.currentLeadership}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => onBrowseParty(party.abbreviation)}
                          className="text-xs font-medium text-slate-600 hover:text-[#0F294A] dark:text-slate-400 dark:hover:text-white"
                        >
                          Filter Members
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenParty(party.slug)}
                          className="text-xs font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                        >
                          Party Record
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                    Latest Political &amp; Electoral Record Updates
                  </h2>
                  <button
                    type="button"
                    onClick={() => onNavigate('elections')}
                    className="text-xs font-semibold text-[#0F294A] hover:underline whitespace-nowrap dark:text-sky-400"
                  >
                    Election Archive
                  </button>
                </div>

                <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {data.latestUpdates.map((upd) => (
                    <li
                      key={upd.id}
                      className="flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {upd.title}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                          {upd.detail}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <VerificationLabel status={upd.verificationStatus} compact />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
