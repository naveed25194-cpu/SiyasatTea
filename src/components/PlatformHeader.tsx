export type AppSection =
  | 'overview'
  | 'politicians'
  | 'politician-detail'
  | 'parties'
  | 'party-detail'
  | 'elections'
  | 'financials'
  | 'parliament'
  | 'sources'
  | 'live-lookup'
  | 'admin';

interface PlatformHeaderProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

export function PlatformHeader({ activeSection, onNavigate }: PlatformHeaderProps) {
  const isPoliticians =
    activeSection === 'politicians' || activeSection === 'politician-detail';
  const isParties = activeSection === 'parties' || activeSection === 'party-detail';
  const isTransparency =
    activeSection === 'financials' ||
    activeSection === 'parliament' ||
    activeSection === 'sources' ||
    activeSection === 'live-lookup';

  const linkClass = (active: boolean) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F294A] dark:focus-visible:outline-sky-400 ${
      active
        ? 'text-[#0F294A] underline decoration-2 underline-offset-8 dark:text-white'
        : 'text-slate-600 hover:text-[#0F294A] dark:text-slate-300 dark:hover:text-white'
    }`;

  return (
    <header
      id="top"
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-[#090E17]/95"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="font-display text-lg font-semibold tracking-tight text-[#0F294A] whitespace-nowrap shrink-0 sm:text-xl dark:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F294A]"
        >
          PakPolitico
        </button>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 md:flex"
        >
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className={linkClass(activeSection === 'overview')}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigate('politicians')}
            className={linkClass(isPoliticians)}
          >
            Politicians
          </button>
          <button
            type="button"
            onClick={() => onNavigate('parties')}
            className={linkClass(isParties)}
          >
            Parties
          </button>
          <button
            type="button"
            onClick={() => onNavigate('elections')}
            className={linkClass(activeSection === 'elections')}
          >
            Elections
          </button>
          <button
            type="button"
            onClick={() => onNavigate('financials')}
            className={linkClass(isTransparency)}
          >
            Transparency
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] ${
              activeSection === 'admin'
                ? 'bg-[#14532D] text-white hover:bg-[#166534]'
                : 'bg-[#0F294A] text-white hover:bg-[#1E3A5F] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
            }`}
          >
            Admin Portal
          </button>
        </div>
      </div>
    </header>
  );
}
