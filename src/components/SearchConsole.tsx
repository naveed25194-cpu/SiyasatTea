import type { FormEvent, RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { FEATURED_LEADERS } from '../data/featuredLeaders';
import type { PoliticianDossier } from '../types/politician';

interface SearchConsoleProps {
  query: string;
  validationError: string | null;
  isLoading: boolean;
  activeLeaderName: string | null;
  recentDossiers: PoliticianDossier[];
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (searchName: string) => void;
  onSelectCachedDossier: (dossier: PoliticianDossier) => void;
}

export function SearchConsole({
  query,
  validationError,
  isLoading,
  activeLeaderName,
  recentDossiers,
  inputRef,
  onQueryChange,
  onSubmitSearch,
  onSelectCachedDossier,
}: SearchConsoleProps) {
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmitSearch(query);
  };

  return (
    <section
      id="search-console"
      className="border-b border-slate-200 bg-white py-8 sm:py-10 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
            Live Web Grounding · Election Commission &amp; Parliamentary Filings
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#0F294A] text-balance sm:text-4xl dark:text-white">
            Live Public Record Lookup via Search Grounding
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Search any Pakistani politician to compile party affiliation, constituency and electoral
            history, key public offices, and publicly documented asset declarations using live
            Google Search grounding.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} noValidate className="mt-7 max-w-3xl">
          <label htmlFor="politician-search" className="sr-only">
            Search Pakistani politician by name
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                id="politician-search"
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Enter a politician's name (e.g., Shehbaz Sharif, Sherry Rehman)"
                aria-invalid={Boolean(validationError)}
                aria-describedby={validationError ? 'search-validation-error' : undefined}
                className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white py-3 pr-10 pl-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-[#0F294A] focus:outline-2 focus:outline-offset-0 focus:outline-[#0F294A]/20 sm:text-base dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="Clear search query"
                  className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#0F294A] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[48px] rounded-lg bg-[#14532D] px-6 py-3 text-sm font-semibold text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
            >
              {isLoading ? 'Searching Records...' : 'Look Up Record'}
            </button>
          </div>

          {validationError && (
            <p
              id="search-validation-error"
              role="alert"
              className="mt-2.5 text-sm font-medium text-amber-800 dark:text-amber-300"
            >
              {validationError}
            </p>
          )}
        </form>

        <div id="quick-select" className="mt-7 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
              Quick-Select Leaders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a profile to retrieve current grounded records
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2.5" role="group" aria-label="Quick-select Pakistani politicians">
            {FEATURED_LEADERS.map((leader) => {
              const isSelected =
                activeLeaderName?.toLowerCase() === leader.name.toLowerCase();

              return (
                <button
                  key={leader.id}
                  type="button"
                  disabled={isLoading}
                  aria-pressed={isSelected}
                  onClick={() => onSubmitSearch(leader.name)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] ${
                    isSelected
                      ? 'border-[#0F294A] bg-[#0F294A] text-white dark:border-emerald-500 dark:bg-emerald-600'
                      : 'border-slate-300 bg-white text-slate-900 hover:border-[#0F294A]/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{leader.name}</span>
                  <span
                    aria-hidden="true"
                    className={isSelected ? 'text-white/60' : 'text-slate-400'}
                  >
                    ·
                  </span>
                  <span
                    className={`font-mono text-xs ${
                      isSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {leader.partyShort}
                  </span>
                </button>
              );
            })}
          </div>

          {recentDossiers.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-500 dark:text-slate-400">Session archive:</span>
              {recentDossiers.map((item) => {
                const isCurrent =
                  activeLeaderName?.toLowerCase() === item.fullName.toLowerCase();
                return (
                  <button
                    key={item.fullName}
                    type="button"
                    onClick={() => onSelectCachedDossier(item)}
                    className={`min-h-[32px] underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0F294A] ${
                      isCurrent
                        ? 'font-semibold text-[#14532D] underline dark:text-emerald-400'
                        : 'text-slate-600 hover:text-[#0F294A] hover:underline dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {item.fullName} ({item.partyAbbreviation})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
