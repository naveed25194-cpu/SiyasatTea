import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  PROVINCES,
  filterAndPaginatePoliticians,
  type PoliticianDirectoryItem,
  type SearchFilterParams,
} from '../utils/platformLogic';
import { VerificationLabel } from './VerificationLabel';

interface PoliticiansDirectoryProps {
  politicians: PoliticianDirectoryItem[];
  parties: Array<{ abbreviation: string; name: string }>;
  initialFilters?: Partial<SearchFilterParams>;
  isLoading: boolean;
  onSelectPolitician: (slug: string) => void;
  onOpenLiveLookup: (query: string) => void;
}

export function PoliticiansDirectory({
  politicians,
  parties,
  initialFilters,
  isLoading,
  onSelectPolitician,
  onOpenLiveLookup,
}: PoliticiansDirectoryProps) {
  const [query, setQuery] = useState(initialFilters?.query ?? '');
  const [province, setProvince] = useState(initialFilters?.province ?? 'All Provinces');
  const [party, setParty] = useState(initialFilters?.party ?? 'All');
  const [position, setPosition] = useState(initialFilters?.position ?? '');
  const [constituency, setConstituency] = useState(initialFilters?.constituency ?? '');
  const [electionYear, setElectionYear] = useState(initialFilters?.electionYear ?? '');
  const [sortBy, setSortBy] = useState<SearchFilterParams['sortBy']>(
    initialFilters?.sortBy ?? 'name_asc',
  );
  const [page, setPage] = useState(1);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const p of politicians) {
      for (const y of p.electionYears) set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [politicians]);

  const result = useMemo(
    () =>
      filterAndPaginatePoliticians(politicians, {
        query,
        province,
        party,
        position,
        constituency,
        electionYear,
        sortBy,
        page,
        pageSize: 6,
      }),
    [politicians, query, province, party, position, constituency, electionYear, sortBy, page],
  );

  const resetFilters = () => {
    setQuery('');
    setProvince('All Provinces');
    setParty('All');
    setPosition('');
    setConstituency('');
    setElectionYear('');
    setSortBy('name_asc');
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
            Searchable Civic Register
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#0F294A] dark:text-white">
            Pakistani Politicians Directory
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Filter records by name, political party, province, constituency, office, or election
            year.
          </p>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="min-h-[40px] self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 hover:bg-slate-50 sm:self-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Reset Filters
        </button>
      </div>

      {/* Multi-Criteria Filter Panel */}
      <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="sm:col-span-2">
          <label
            htmlFor="dir-search"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Politician Name
          </label>
          <div className="relative mt-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="dir-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Name, party, or seat..."
              className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="dir-province"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Province
          </label>
          <select
            id="dir-province"
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setPage(1);
            }}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="dir-party"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Political Party
          </label>
          <select
            id="dir-party"
            value={party}
            onChange={(e) => {
              setParty(e.target.value);
              setPage(1);
            }}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Parties</option>
            {parties.map((p) => (
              <option key={p.abbreviation} value={p.abbreviation}>
                {p.abbreviation} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="dir-constituency"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Constituency
          </label>
          <input
            id="dir-constituency"
            type="text"
            value={constituency}
            onChange={(e) => {
              setConstituency(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. NA-130"
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="dir-year"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Election Year
          </label>
          <select
            id="dir-year"
            value={electionYear}
            onChange={(e) => {
              setElectionYear(e.target.value);
              setPage(1);
            }}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label
            htmlFor="dir-position"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Political Position Keyword
          </label>
          <input
            id="dir-position"
            type="text"
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. Chief Minister, President, Speaker, MNA..."
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label
            htmlFor="dir-sort"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Sort Order
          </label>
          <select
            id="dir-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SearchFilterParams['sortBy'])}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="name_asc">Name (A – Z)</option>
            <option value="name_desc">Name (Z – A)</option>
            <option value="province_asc">Province (A – Z)</option>
            <option value="updated_desc">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <p className="font-mono tabular-nums">
          Showing {result.items.length} of {result.total} matching profiles (Page {result.page} of{' '}
          {result.totalPages})
        </p>
        {query.trim().length > 1 && (
          <button
            type="button"
            onClick={() => onOpenLiveLookup(query.trim())}
            className="font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
          >
            Search &ldquo;{query.trim()}&rdquo; with Live Web Grounding
          </button>
        )}
      </div>

      {/* Directory List / Grid */}
      {isLoading ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-36 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : result.items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            No database profiles matched your current filters
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Adjust your filter criteria or run a live Google Search grounded lookup for any
            Pakistani politician.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[42px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear All Filters
            </button>
            {query.trim().length > 1 && (
              <button
                type="button"
                onClick={() => onOpenLiveLookup(query.trim())}
                className="min-h-[42px] rounded-lg bg-[#0F294A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E3A5F]"
              >
                Query Live Web Records
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {result.items.map((pol) => (
            <article
              key={pol.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>{pol.partyAbbreviation}</span>
                      <span aria-hidden="true" className="mx-1.5">
                        ·
                      </span>
                      <span>{pol.province}</span>
                      <span aria-hidden="true" className="mx-1.5">
                        ·
                      </span>
                      <span className="font-mono tabular-nums">
                        {pol.currentConstituencyCode}
                      </span>
                      {pol.isDemoData && (
                        <>
                          <span aria-hidden="true" className="mx-1.5">
                            ·
                          </span>
                          <span>Demo Record</span>
                        </>
                      )}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-white">
                      {pol.fullName}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      {pol.currentPositionTitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <VerificationLabel status={pol.verificationStatus} compact />
                <button
                  type="button"
                  onClick={() => onSelectPolitician(pol.slug)}
                  className="min-h-[38px] rounded-lg bg-[#0F294A] px-4 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#1E3A5F] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  View Full Profile
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <nav
          aria-label="Directory pagination"
          className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800"
        >
          <button
            type="button"
            disabled={result.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          <span className="font-mono text-xs text-slate-600 tabular-nums dark:text-slate-400">
            Page {result.page} / {result.totalPages}
          </span>

          <button
            type="button"
            disabled={result.page >= result.totalPages}
            onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </section>
  );
}
