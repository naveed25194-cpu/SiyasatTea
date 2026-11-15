import type { AppSection } from './PlatformHeader';

interface MethodologyFooterProps {
  onNavigate: (section: AppSection) => void;
}

export function MethodologyFooter({ onNavigate }: MethodologyFooterProps) {
  return (
    <footer
      id="methodology"
      className="border-t border-slate-200 bg-white py-10 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-base font-semibold text-[#0F294A] dark:text-white">
            PakPolitico — Pakistan Political Transparency Platform
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Non-partisan civic archive organizing public profiles, political parties, election
            histories, ECP Form-B asset declarations, parliamentary attendance, and source
            verification statuses. Records labeled &ldquo;Demo Sample&rdquo; are illustrative
            seed records for platform exploration; never cite unverified entries without inspecting
            primary official filings.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600 shrink-0 dark:text-slate-300"
        >
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#0F294A] dark:hover:text-white"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigate('politicians')}
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#0F294A] dark:hover:text-white"
          >
            Politicians
          </button>
          <button
            type="button"
            onClick={() => onNavigate('parties')}
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#0F294A] dark:hover:text-white"
          >
            Parties
          </button>
          <button
            type="button"
            onClick={() => onNavigate('elections')}
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#0F294A] dark:hover:text-white"
          >
            Elections
          </button>
          <button
            type="button"
            onClick={() => onNavigate('financials')}
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#0F294A] dark:hover:text-white"
          >
            Assets &amp; Financials
          </button>
          <button
            type="button"
            onClick={() => onNavigate('sources')}
            className="whitespace-nowrap transition-colors duration-150 hover:text-[#0F294A] dark:hover:text-white"
          >
            Sources
          </button>
        </nav>
      </div>
    </footer>
  );
}
