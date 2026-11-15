import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { DossierView } from './components/DossierView';
import { ElectionsView, type ElectionRecordRow } from './components/ElectionsView';
import { HomeOverview, type OverviewPayload } from './components/HomeOverview';
import { MethodologyFooter } from './components/MethodologyFooter';
import {
  PartiesView,
  type PartyDetailPayload,
  type PartyDirectoryItem,
} from './components/PartiesView';
import { PlatformHeader, type AppSection } from './components/PlatformHeader';
import {
  PoliticianProfilePage,
  type PoliticianDetailPayload,
} from './components/PoliticianProfilePage';
import { PoliticiansDirectory } from './components/PoliticiansDirectory';
import { SearchConsole } from './components/SearchConsole';
import {
  TransparencyHub,
  type FinancialRecordItem,
  type ParliamentaryRecordItem,
  type SourcesPayload,
} from './components/TransparencyHub';
import type { DossierApiError, PoliticianDossier } from './types/politician';
import { validateSearchQuery } from './utils/dossierParser';
import type { PoliticianDirectoryItem, SearchFilterParams } from './utils/platformLogic';

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('overview');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pakpolitico-theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Database-backed platform state
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [politicians, setPoliticians] = useState<PoliticianDirectoryItem[]>([]);
  const [politiciansLoading, setPoliticiansLoading] = useState(false);
  const [directoryFilters, setDirectoryFilters] = useState<Partial<SearchFilterParams>>({});
  const [directoryInstanceKey, setDirectoryInstanceKey] = useState(0);

  const [politicianDetail, setPoliticianDetail] = useState<PoliticianDetailPayload | null>(null);
  const [politicianDetailLoading, setPoliticianDetailLoading] = useState(false);
  const [politicianDetailError, setPoliticianDetailError] = useState<string | null>(null);

  const [parties, setParties] = useState<PartyDirectoryItem[]>([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [partyDetail, setPartyDetail] = useState<PartyDetailPayload | null>(null);

  const [elections, setElections] = useState<ElectionRecordRow[]>([]);
  const [electionsLoading, setElectionsLoading] = useState(false);

  const [financials, setFinancials] = useState<FinancialRecordItem[]>([]);
  const [parliament, setParliament] = useState<ParliamentaryRecordItem[]>([]);
  const [sourcesData, setSourcesData] = useState<SourcesPayload | null>(null);
  const [transparencyLoading, setTransparencyLoading] = useState(false);

  // Live Gemini Search Grounding lookup state
  const [query, setQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lastSearchedName, setLastSearchedName] = useState<string | null>(null);
  const [activeDossier, setActiveDossier] = useState<PoliticianDossier | null>(null);
  const [recentDossiers, setRecentDossiers] = useState<PoliticianDossier[]>([]);

  const dossierCacheRef = useRef<Map<string, PoliticianDossier>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('pakpolitico-theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage failures in sandboxed frames
    }
  }, [isDark]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch('/api/overview');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load platform overview.');
      }
      setOverview(data as OverviewPayload);
    } catch (err) {
      setOverviewError(
        err instanceof Error ? err.message : 'Unable to load platform overview.',
      );
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadPoliticiansAndParties = useCallback(async () => {
    setPoliticiansLoading(true);
    setPartiesLoading(true);
    try {
      const [polRes, partyRes] = await Promise.all([
        fetch('/api/politicians'),
        fetch('/api/parties'),
      ]);
      if (polRes.ok) {
        const polData = (await polRes.json()) as PoliticianDirectoryItem[];
        setPoliticians(polData);
      }
      if (partyRes.ok) {
        const partyData = (await partyRes.json()) as PartyDirectoryItem[];
        setParties(partyData);
      }
    } finally {
      setPoliticiansLoading(false);
      setPartiesLoading(false);
    }
  }, []);

  const loadElections = useCallback(async () => {
    setElectionsLoading(true);
    try {
      const res = await fetch('/api/elections');
      if (res.ok) {
        const data = (await res.json()) as ElectionRecordRow[];
        setElections(data);
      }
    } finally {
      setElectionsLoading(false);
    }
  }, []);

  const loadTransparencyData = useCallback(async () => {
    setTransparencyLoading(true);
    try {
      const [finRes, parlRes, srcRes] = await Promise.all([
        fetch('/api/financials'),
        fetch('/api/parliament'),
        fetch('/api/sources'),
      ]);
      if (finRes.ok) setFinancials((await finRes.json()) as FinancialRecordItem[]);
      if (parlRes.ok) setParliament((await parlRes.json()) as ParliamentaryRecordItem[]);
      if (srcRes.ok) setSourcesData((await srcRes.json()) as SourcesPayload);
    } finally {
      setTransparencyLoading(false);
    }
  }, []);

  const openPoliticianProfile = useCallback(async (slug: string) => {
    setActiveSection('politician-detail');
    setPoliticianDetailLoading(true);
    setPoliticianDetailError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await fetch(`/api/politicians/${encodeURIComponent(slug)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load politician profile.');
      }
      setPoliticianDetail(data as PoliticianDetailPayload);
    } catch (err) {
      setPoliticianDetail(null);
      setPoliticianDetailError(
        err instanceof Error ? err.message : 'Unable to load politician profile.',
      );
    } finally {
      setPoliticianDetailLoading(false);
    }
  }, []);

  const openPartyProfile = useCallback(async (slug: string) => {
    setActiveSection('party-detail');
    setPartiesLoading(true);
    setPartyDetail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await fetch(`/api/parties/${encodeURIComponent(slug)}`);
      if (res.ok) {
        setPartyDetail((await res.json()) as PartyDetailPayload);
      }
    } finally {
      setPartiesLoading(false);
    }
  }, []);

  const performLiveLookup = useCallback(async (rawName: string, bypassCache = false) => {
    const validation = validateSearchQuery(rawName);
    if (!validation.valid) {
      setValidationError(validation.error ?? 'Please enter a valid politician name.');
      searchInputRef.current?.focus();
      return;
    }

    const normalized = validation.normalized;
    const cacheKey = normalized.toLowerCase();

    setValidationError(null);
    setLookupError(null);
    setQuery(normalized);
    setLastSearchedName(normalized);

    const cached = !bypassCache ? dossierCacheRef.current.get(cacheKey) : undefined;
    if (cached) {
      setActiveDossier(cached);
      setLookupLoading(false);
      setLoadingName(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLookupLoading(true);
    setLoadingName(normalized);

    try {
      const response = await fetch('/api/politician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalized }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => ({}))) as
        | PoliticianDossier
        | DossierApiError;

      if (!response.ok) {
        const msg =
          'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : 'Unable to retrieve public records right now.';
        setLookupError(msg);
        setActiveDossier(null);
        return;
      }

      const dossier = payload as PoliticianDossier;
      dossierCacheRef.current.set(cacheKey, dossier);
      dossierCacheRef.current.set(dossier.fullName.toLowerCase(), dossier);

      setActiveDossier(dossier);
      setRecentDossiers((prev) => {
        const filtered = prev.filter(
          (item) => item.fullName.toLowerCase() !== dossier.fullName.toLowerCase(),
        );
        return [dossier, ...filtered].slice(0, 6);
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setLookupError(
        'Network error while querying public records. Please check your connection and try again.',
      );
      setActiveDossier(null);
    } finally {
      if (abortControllerRef.current === controller) {
        setLookupLoading(false);
        setLoadingName(null);
      }
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadPoliticiansAndParties();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadOverview, loadPoliticiansAndParties]);

  const navigateTo = useCallback(
    (section: AppSection) => {
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (section === 'overview' && !overview) {
        void loadOverview();
      } else if (
        (section === 'politicians' || section === 'parties') &&
        (politicians.length === 0 || parties.length === 0)
      ) {
        void loadPoliticiansAndParties();
      } else if (section === 'elections' && elections.length === 0) {
        void loadElections();
      } else if (
        (section === 'financials' || section === 'parliament' || section === 'sources') &&
        (financials.length === 0 || parliament.length === 0 || !sourcesData)
      ) {
        void loadTransparencyData();
      }
    },
    [
      overview,
      politicians.length,
      parties.length,
      elections.length,
      financials.length,
      parliament.length,
      sourcesData,
      loadOverview,
      loadPoliticiansAndParties,
      loadElections,
      loadTransparencyData,
    ],
  );

  const openDirectoryWithFilters = useCallback(
    (filters: Partial<SearchFilterParams>) => {
      setDirectoryFilters(filters);
      setDirectoryInstanceKey((k) => k + 1);
      navigateTo('politicians');
    },
    [navigateTo],
  );

  const handleOpenLiveLookupWithQuery = useCallback(
    (searchName: string) => {
      setActiveSection('live-lookup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (searchName.trim()) {
        void performLiveLookup(searchName);
      }
    },
    [performLiveLookup],
  );

  const handleAdminDataChanged = useCallback(() => {
    void loadOverview();
    void loadPoliticiansAndParties();
    void loadElections();
    void loadTransparencyData();
  }, [loadOverview, loadPoliticiansAndParties, loadElections, loadTransparencyData]);

  const utilitySubLinkClass = (active: boolean) =>
    `whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? 'bg-[#0F294A] text-white dark:bg-slate-100 dark:text-slate-900'
        : 'text-slate-600 hover:bg-slate-200/70 hover:text-[#0F294A] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  const activeLeaderName = lastSearchedName ?? activeDossier?.fullName ?? loadingName;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 dark:bg-[#090E17] dark:text-slate-100">
      <PlatformHeader activeSection={activeSection} onNavigate={navigateTo} />

      {/* Non-sticky Workspace Utility Bar: mobile nav, transparency shortcuts & theme switch */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <nav
            aria-label="Mobile and sub-section navigation"
            className="flex min-w-0 max-w-full flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
          >
            <span className="contents md:hidden">
              <button
                type="button"
                onClick={() => navigateTo('overview')}
                className={utilitySubLinkClass(activeSection === 'overview')}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => navigateTo('politicians')}
                className={utilitySubLinkClass(
                  activeSection === 'politicians' || activeSection === 'politician-detail',
                )}
              >
                Politicians
              </button>
              <button
                type="button"
                onClick={() => navigateTo('parties')}
                className={utilitySubLinkClass(
                  activeSection === 'parties' || activeSection === 'party-detail',
                )}
              >
                Parties
              </button>
              <button
                type="button"
                onClick={() => navigateTo('elections')}
                className={utilitySubLinkClass(activeSection === 'elections')}
              >
                Elections
              </button>
            </span>

            <button
              type="button"
              onClick={() => navigateTo('financials')}
              className={utilitySubLinkClass(activeSection === 'financials')}
            >
              Assets &amp; Financials
            </button>
            <button
              type="button"
              onClick={() => navigateTo('parliament')}
              className={utilitySubLinkClass(activeSection === 'parliament')}
            >
              Parliamentary Performance
            </button>
            <button
              type="button"
              onClick={() => navigateTo('sources')}
              className={utilitySubLinkClass(activeSection === 'sources')}
            >
              Sources &amp; Verification
            </button>
            <button
              type="button"
              onClick={() => navigateTo('live-lookup')}
              className={utilitySubLinkClass(activeSection === 'live-lookup')}
            >
              Live Web Lookup
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-pressed={isDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#0F294A]" aria-hidden="true" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      <main className="flex-1">
        {activeSection === 'overview' && (
          <HomeOverview
            data={overview}
            isLoading={overviewLoading}
            error={overviewError}
            onRetry={() => void loadOverview()}
            onSearchPolitician={(q) => openDirectoryWithFilters({ query: q })}
            onBrowseProvince={(province) => openDirectoryWithFilters({ province })}
            onBrowseParty={(party) => openDirectoryWithFilters({ party })}
            onOpenPolitician={(slug) => void openPoliticianProfile(slug)}
            onOpenParty={(slug) => void openPartyProfile(slug)}
            onNavigate={navigateTo}
          />
        )}

        {activeSection === 'politicians' && (
          <PoliticiansDirectory
            key={directoryInstanceKey}
            politicians={politicians}
            parties={parties.map((p) => ({ abbreviation: p.abbreviation, name: p.name }))}
            initialFilters={directoryFilters}
            isLoading={politiciansLoading}
            onSelectPolitician={(slug) => void openPoliticianProfile(slug)}
            onOpenLiveLookup={handleOpenLiveLookupWithQuery}
          />
        )}

        {activeSection === 'politician-detail' && (
          <PoliticianProfilePage
            detail={politicianDetail}
            isLoading={politicianDetailLoading}
            error={politicianDetailError}
            onBack={() => navigateTo('politicians')}
            onOpenParty={(slug) => void openPartyProfile(slug)}
          />
        )}

        {(activeSection === 'parties' || activeSection === 'party-detail') && (
          <PartiesView
            parties={parties}
            selectedDetail={partyDetail}
            isDetailMode={activeSection === 'party-detail'}
            isLoading={partiesLoading}
            onSelectParty={(slug) => void openPartyProfile(slug)}
            onBackToList={() => navigateTo('parties')}
            onOpenPolitician={(slug) => void openPoliticianProfile(slug)}
          />
        )}

        {activeSection === 'elections' && (
          <ElectionsView
            records={elections}
            isLoading={electionsLoading}
            onOpenPolitician={(slug) => void openPoliticianProfile(slug)}
          />
        )}

        {(activeSection === 'financials' ||
          activeSection === 'parliament' ||
          activeSection === 'sources') && (
          <TransparencyHub
            activeTab={activeSection}
            financials={financials}
            parliament={parliament}
            sourcesData={sourcesData}
            isLoading={transparencyLoading}
            onChangeTab={navigateTo}
            onOpenPolitician={(slug) => void openPoliticianProfile(slug)}
          />
        )}

        {activeSection === 'live-lookup' && (
          <>
            <SearchConsole
              query={query}
              validationError={validationError}
              isLoading={lookupLoading}
              activeLeaderName={activeLeaderName}
              recentDossiers={recentDossiers}
              inputRef={searchInputRef}
              onQueryChange={(val) => {
                setQuery(val);
                if (validationError) setValidationError(null);
              }}
              onSubmitSearch={(name) => void performLiveLookup(name)}
              onSelectCachedDossier={(dossier) => {
                setValidationError(null);
                setLookupError(null);
                setQuery(dossier.fullName);
                setLastSearchedName(dossier.fullName);
                setActiveDossier(dossier);
              }}
            />

            <DossierView
              dossier={activeDossier}
              isLoading={lookupLoading}
              loadingName={loadingName}
              errorMessage={lookupError}
              lastSearchedName={lastSearchedName}
              onSelectLeader={(name) => void performLiveLookup(name)}
              onRetry={() => {
                if (lastSearchedName) void performLiveLookup(lastSearchedName, true);
              }}
            />
          </>
        )}

        {activeSection === 'admin' && (
          <AdminDashboard onDataChanged={handleAdminDataChanged} />
        )}
      </main>

      <MethodologyFooter onNavigate={navigateTo} />
    </div>
  );
}
