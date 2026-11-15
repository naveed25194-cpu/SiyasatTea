import { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { VerificationLabel } from './VerificationLabel';

export interface PartyDirectoryItem {
  id: number;
  slug: string;
  name: string;
  abbreviation: string;
  foundedYear: number;
  foundingLeadership: string;
  currentLeadership: string;
  headquarters: string;
  ideologySummary: string;
  politicalHistory: string;
  parliamentarySeatsSummary: string;
  affiliationsHistory: string;
  logoInitials: string;
  brandColor: string;
  verificationStatus: string;
  isDemoData: boolean;
  documentedMembersCount: number;
  documentedElectionWins: number;
  featuredMembers: Array<{
    id: number;
    slug: string;
    fullName: string;
    currentPositionTitle: string;
    province: string;
  }>;
}

export interface PartyDetailPayload {
  party: PartyDirectoryItem;
  members: Array<{
    id: number;
    slug: string;
    fullName: string;
    currentPositionTitle: string;
    province: string;
    currentConstituencyCode: string;
  }>;
  electionHistory: Array<{
    id: number;
    year: number;
    constituencyCode: string;
    constituencyName: string;
    province: string;
    candidateName: string;
    votesReceived: number;
    isWinner: boolean;
    resultStatus: string;
    verificationStatus: string;
  }>;
  source: {
    title: string;
    url: string;
    publisher: string;
  } | null;
}

interface PartiesViewProps {
  parties: PartyDirectoryItem[];
  selectedDetail: PartyDetailPayload | null;
  isDetailMode: boolean;
  isLoading: boolean;
  onSelectParty: (slug: string) => void;
  onBackToList: () => void;
  onOpenPolitician: (slug: string) => void;
}

export function PartiesView({
  parties,
  selectedDetail,
  isDetailMode,
  isLoading,
  onSelectParty,
  onBackToList,
  onOpenPolitician,
}: PartiesViewProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.abbreviation.toLowerCase().includes(q) ||
        p.currentLeadership.toLowerCase().includes(q) ||
        p.ideologySummary.toLowerCase().includes(q),
    );
  }, [parties, search]);

  if (isDetailMode) {
    if (isLoading || !selectedDetail) {
      return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </section>
      );
    }

    const { party, members, electionHistory, source } = selectedDetail;

    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <button
          type="button"
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Political Parties Directory</span>
        </button>

        <article className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-200 bg-slate-50/70 p-6 sm:p-8 dark:border-slate-800 dark:bg-[#0D1420]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div
                aria-hidden="true"
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#0F294A] font-mono text-sm font-semibold text-white dark:border-slate-700"
              >
                {party.logoInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-semibold text-[#14532D] dark:text-emerald-400">
                    {party.abbreviation}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Founded {party.foundedYear}</span>
                  <span aria-hidden="true">·</span>
                  <span>{party.headquarters}</span>
                  <span aria-hidden="true">·</span>
                  <VerificationLabel status={party.verificationStatus} compact />
                </div>
                <h1 className="mt-2 font-display text-3xl font-semibold text-[#0F294A] dark:text-white">
                  {party.name}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {party.ideologySummary}
                </p>
              </div>
            </div>
          </header>

          <div className="grid divide-y divide-slate-200 border-b border-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
            <div className="space-y-4 p-6 sm:p-8">
              <div>
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Founding Leadership
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  {party.foundingLeadership}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Current Verified Leadership
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  {party.currentLeadership}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Historical Affiliations &amp; Coalitions
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {party.affiliationsHistory}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-6 sm:p-8">
              <div>
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Political History
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {party.politicalHistory}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Parliamentary Representation Summary
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {party.parliamentarySeatsSummary}
                </p>
              </div>
              {source && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Source:{' '}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                  >
                    {source.title} ({source.publisher})
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-slate-800">
            <section className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                Documented Leadership &amp; Members ({members.length})
              </h2>
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {m.fullName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {m.currentPositionTitle} · {m.province} ·{' '}
                        <span className="font-mono">{m.currentConstituencyCode}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPolitician(m.slug)}
                      className="text-xs font-semibold text-[#0F294A] hover:underline whitespace-nowrap dark:text-sky-400"
                    >
                      Profile
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                Indexed Election Participation ({electionHistory.length})
              </h2>
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {electionHistory.map((el) => (
                  <li key={el.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#0F294A] tabular-nums dark:text-sky-400">
                        {el.year} · {el.constituencyCode} ({el.province})
                      </span>
                      <span className="text-xs font-semibold text-[#14532D] dark:text-emerald-400">
                        {el.resultStatus}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-900 dark:text-slate-100">
                      {el.candidateName} —{' '}
                      <span className="font-mono text-xs tabular-nums">
                        {el.votesReceived.toLocaleString('en-US')} votes
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
            ECP Registered Parties Archive
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#0F294A] dark:text-white">
            Political Parties Directory
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Search Pakistani political parties, founding leadership, current leadership, and
            parliamentary records.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <label htmlFor="party-dir-search" className="sr-only">
            Search political parties
          </label>
          <input
            id="party-dir-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter parties by name or leader..."
            className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {filtered.map((party) => (
          <article
            key={party.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0F294A] font-mono text-xs font-semibold text-white"
                  >
                    {party.logoInitials}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {party.abbreviation} · Founded {party.foundedYear} · {party.headquarters}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-white">
                      {party.name}
                    </h2>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {party.politicalHistory}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Current Leadership</dt>
                  <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                    {party.currentLeadership}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Indexed Archive</dt>
                  <dd className="mt-0.5 font-mono text-slate-900 tabular-nums dark:text-slate-100">
                    {party.documentedMembersCount} profiles · {party.documentedElectionWins} wins
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <VerificationLabel status={party.verificationStatus} compact />
              <button
                type="button"
                onClick={() => onSelectParty(party.slug)}
                className="min-h-[38px] rounded-lg bg-[#0F294A] px-4 py-1.5 text-xs font-semibold text-white whitespace-nowrap hover:bg-[#1E3A5F] dark:bg-slate-100 dark:text-slate-900"
              >
                Inspect Party Record
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
