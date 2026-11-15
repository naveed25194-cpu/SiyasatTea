import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Flag } from 'lucide-react';
import { CorrectionModal } from './CorrectionModal';
import { VerificationLabel } from './VerificationLabel';

export interface PoliticianDetailPayload {
  politician: {
    id: number;
    slug: string;
    fullName: string;
    honorific: string;
    photoUrl: string | null;
    dateOfBirth: string;
    birthPlace: string;
    province: string;
    education: string;
    biography: string;
    currentPositionTitle: string;
    currentConstituencyCode: string;
    businessInterestsSummary: string;
    verificationStatus: string;
    isDemoData: boolean;
    updatedAt: string;
    currentParty: {
      id: number;
      slug: string;
      name: string;
      abbreviation: string;
    } | null;
  };
  partyMemberships: Array<{
    id: number;
    partyName: string;
    partyAbbreviation: string;
    partySlug: string;
    roleInParty: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    notes: string | null;
    verificationStatus: string;
  }>;
  positions: Array<{
    id: number;
    title: string;
    institution: string;
    jurisdiction: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    summary: string;
    verificationStatus: string;
  }>;
  elections: Array<{
    id: number;
    year: number;
    electionTitle: string;
    constituencyCode: string;
    constituencyName: string;
    province: string;
    assemblyType: string;
    partyAbbreviation: string;
    votesReceived: number;
    totalValidVotes: number | null;
    isWinner: boolean;
    winningCandidateName: string;
    resultStatus: string;
    verificationStatus: string;
  }>;
  constituenciesRepresented: Array<{
    code: string;
    name: string;
    province: string;
    assemblyType: string;
  }>;
  assetDeclarations: Array<{
    id: number;
    declarationYear: number;
    fiscalYearLabel: string;
    currency: string;
    totalDeclaredAssets: string;
    totalDeclaredLiabilities: string;
    netDeclaredSummary: string;
    filingAuthority: string;
    verificationStatus: string;
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
  }>;
  parliamentaryRecords: Array<{
    id: number;
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
  }>;
  familyRelationships: Array<{
    id: number;
    relativeName: string;
    relationshipType: string;
    publicRoleOrAffiliation: string;
    verificationStatus: string;
  }>;
  newsAndStatements: Array<{
    id: number;
    headline: string;
    statementOrSummary: string;
    publishedDate: string;
    publisher: string;
    url: string;
    verificationStatus: string;
  }>;
  verificationRecords: Array<{
    id: number;
    fieldOrSection: string;
    claimSummary: string;
    status: string;
    reviewerNotes: string | null;
    verifiedAt: string;
  }>;
  sources: Array<{
    id: number;
    title: string;
    url: string;
    publisher: string;
    publicationDate: string;
    dateCollected: string;
    lastUpdatedAt: string;
    verificationStatus: string;
  }>;
  timeline: Array<{
    id: string;
    year: string;
    category: string;
    title: string;
    subtitle: string;
    verificationStatus: string;
  }>;
}

interface PoliticianProfilePageProps {
  detail: PoliticianDetailPayload | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onOpenParty: (slug: string) => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return (parts[0] ?? 'PK').slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PoliticianProfilePage({
  detail,
  isLoading,
  error,
  onBack,
  onOpenParty,
}: PoliticianProfilePageProps) {
  const [correctionOpen, setCorrectionOpen] = useState(false);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-44 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Politicians Directory</span>
        </button>
        <div
          role="alert"
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Politician profile unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {error ?? 'The requested public profile could not be found.'}
          </p>
        </div>
      </section>
    );
  }

  const { politician: pol } = detail;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[38px] items-center gap-1.5 text-sm font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Politicians Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setCorrectionOpen(true)}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Report Incorrect Information</span>
        </button>
      </div>

      {pol.isDemoData && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-100/80 px-4 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className="font-semibold">Demonstration Archive Notice:</span> This profile
          contains sample demonstration entries for platform testing. Financial totals and
          parliamentary tallies marked as Demo are illustrative placeholders rather than audited
          filings.
        </p>
      )}

      <article className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* 1, 2, 3, 4: Identity, Photo, Biography, DOB, Education */}
        <header className="border-b border-slate-200 bg-slate-50/70 p-6 sm:p-8 dark:border-slate-800 dark:bg-[#0D1420]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {pol.photoUrl ? (
                <img
                  src={pol.photoUrl}
                  alt={pol.fullName}
                  referrerPolicy="no-referrer"
                  className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F294A] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <span className="font-display text-2xl font-semibold">
                    {getInitials(pol.fullName)}
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {pol.currentParty?.abbreviation ?? 'IND'}
                  </span>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{pol.province}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{pol.currentConstituencyCode}</span>
                  <span aria-hidden="true">·</span>
                  <VerificationLabel status={pol.verificationStatus} compact />
                </div>

                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#0F294A] text-balance sm:text-4xl dark:text-white">
                  {pol.fullName}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {pol.honorific} · {pol.currentPositionTitle}
                </p>

                {pol.currentParty && (
                  <p className="mt-1.5 text-sm">
                    <button
                      type="button"
                      onClick={() => onOpenParty(pol.currentParty!.slug)}
                      className="font-semibold text-[#14532D] hover:underline dark:text-emerald-400"
                    >
                      {pol.currentParty.name} ({pol.currentParty.abbreviation})
                    </button>
                  </p>
                )}

                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {pol.biography}
                </p>
              </div>
            </div>

            <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-200 pt-4 text-sm lg:w-72 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-slate-800">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Date of Birth
                </dt>
                <dd className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums dark:text-slate-100">
                  {pol.dateOfBirth}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Birthplace
                </dt>
                <dd className="mt-0.5 text-sm text-slate-900 dark:text-slate-100">
                  {pol.birthPlace}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Education &amp; Qualifications
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {pol.education}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        {/* 5 & 6: Political Party History & Public Positions */}
        <div className="grid divide-y divide-slate-200 border-b border-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
          <section className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
              Political Party &amp; Affiliation History
            </h2>
            {detail.partyMemberships.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {detail.partyMemberships.map((m) => (
                  <li key={m.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenParty(m.partySlug)}
                        className="text-sm font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                      >
                        {m.partyName} ({m.partyAbbreviation})
                      </button>
                      <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {m.startDate} – {m.isCurrent ? 'Present' : m.endDate ?? 'Completed'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {m.roleInParty}
                    </p>
                    {m.notes && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.notes}</p>
                    )}
                    <div className="mt-1.5">
                      <VerificationLabel status={m.verificationStatus} compact />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Unavailable in current archive.
              </p>
            )}
          </section>

          <section className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
              Political Positions Held
            </h2>
            {detail.positions.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {detail.positions.map((pos) => (
                  <li key={pos.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {pos.title}
                      </h3>
                      <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {pos.startDate} – {pos.isCurrent ? 'Present' : pos.endDate ?? 'Ended'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#14532D] dark:text-emerald-400">
                      {pos.institution} · {pos.jurisdiction}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {pos.summary}
                    </p>
                    <div className="mt-1.5">
                      <VerificationLabel status={pos.verificationStatus} compact />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No public offices recorded.
              </p>
            )}
          </section>
        </div>

        {/* 7 & 8: Election History & Constituencies Represented */}
        <section className="border-b border-slate-200 p-6 sm:p-8 dark:border-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                Election History &amp; Constituencies Represented
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Constituencies:{' '}
                {detail.constituenciesRepresented.length > 0
                  ? detail.constituenciesRepresented
                      .map((c) => `${c.code} ${c.name} (${c.province})`)
                      .join(' · ')
                  : pol.currentConstituencyCode}
              </p>
            </div>
          </div>

          {detail.elections.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th scope="col" className="py-2.5 pr-4">Year</th>
                    <th scope="col" className="py-2.5 pr-4">Constituency</th>
                    <th scope="col" className="py-2.5 pr-4">Assembly</th>
                    <th scope="col" className="py-2.5 pr-4">Party</th>
                    <th scope="col" className="py-2.5 pr-4 text-right">Votes</th>
                    <th scope="col" className="py-2.5 pr-4">Result</th>
                    <th scope="col" className="py-2.5">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detail.elections.map((el) => (
                    <tr key={el.id}>
                      <td className="py-3 pr-4 font-mono font-semibold text-slate-900 tabular-nums dark:text-white">
                        {el.year}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                        {el.constituencyCode} · {el.constituencyName}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">
                        {el.assemblyType}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {el.partyAbbreviation}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-xs font-medium text-slate-900 tabular-nums dark:text-slate-100">
                        {el.votesReceived.toLocaleString('en-US')}
                      </td>
                      <td className="py-3 pr-4 text-xs font-medium text-[#14532D] dark:text-emerald-400">
                        {el.resultStatus}
                      </td>
                      <td className="py-3">
                        <VerificationLabel status={el.verificationStatus} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No electoral contests recorded in this archive.
            </p>
          )}
        </section>

        {/* 9: Parliamentary History */}
        <section className="border-b border-slate-200 p-6 sm:p-8 dark:border-slate-800">
          <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
            Parliamentary Performance &amp; Legislative Activity
          </h2>
          {detail.parliamentaryRecords.length > 0 ? (
            <div className="mt-4 space-y-5">
              {detail.parliamentaryRecords.map((pr) => (
                <div
                  key={pr.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {pr.termLabel} — {pr.assemblyName}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Committees: {pr.committeeMemberships}
                      </p>
                    </div>
                    <VerificationLabel status={pr.verificationStatus} compact />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-5 dark:border-slate-800">
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Attendance</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-[#0F294A] tabular-nums dark:text-white">
                        {pr.sessionsAttended}/{pr.totalSessions} (
                        {Math.round((pr.sessionsAttended / Math.max(1, pr.totalSessions)) * 100)}%)
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Questions</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                        {pr.questionsSubmitted}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Bills</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                        {pr.billsIntroduced}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Speeches</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums dark:text-white">
                        {pr.speechesDelivered}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">Voting</dt>
                      <dd className="mt-0.5 font-mono text-base font-semibold text-[#14532D] tabular-nums dark:text-emerald-400">
                        {pr.votingParticipationPct}%
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {pr.notableActivitySummary}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Parliamentary attendance and legislative activity unavailable for current term.
            </p>
          )}
        </section>

        {/* 10 & 11: Publicly Declared Assets, Liabilities & Business Interests */}
        <section className="border-b border-slate-200 p-6 sm:p-8 dark:border-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
              Declared Assets, Liabilities &amp; Business Interests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Self-declared ECP filings are distinct from independently audited wealth
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Publicly Documented Business &amp; Institutional Interests
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {pol.businessInterestsSummary}
            </p>
          </div>

          {detail.assetDeclarations.length > 0 ? (
            <div className="mt-5 space-y-5">
              {detail.assetDeclarations.map((decl) => (
                <div
                  key={decl.id}
                  className="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {decl.fiscalYearLabel} · {decl.filingAuthority}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                        Declared Assets: {decl.totalDeclaredAssets} · Declared Liabilities:{' '}
                        {decl.totalDeclaredLiabilities} ({decl.currency})
                      </p>
                    </div>
                    <VerificationLabel status={decl.verificationStatus} compact />
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {decl.netDeclaredSummary}
                  </p>

                  {(decl.assets.length > 0 || decl.liabilities.length > 0) && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {decl.assets.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Declared Asset Items
                          </h4>
                          <ul className="mt-2 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                            {decl.assets.map((a) => (
                              <li key={a.id} className="py-2">
                                <div className="flex justify-between gap-2 font-medium text-slate-900 dark:text-slate-100">
                                  <span>{a.category}</span>
                                  <span className="font-mono tabular-nums">{a.declaredValue}</span>
                                </div>
                                <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                                  {a.description} ({a.locationOrInstitution})
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {decl.liabilities.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Declared Liabilities
                          </h4>
                          <ul className="mt-2 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                            {decl.liabilities.map((l) => (
                              <li key={l.id} className="py-2">
                                <div className="flex justify-between gap-2 font-medium text-slate-900 dark:text-slate-100">
                                  <span>{l.creditorOrType}</span>
                                  <span className="font-mono tabular-nums">{l.amount}</span>
                                </div>
                                <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                                  {l.description}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No asset declarations indexed yet.
            </p>
          )}
        </section>

        {/* 12 & 13: Public Family Connections & Career Timeline */}
        <div className="grid divide-y divide-slate-200 border-b border-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
          <section className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
              Publicly Documented Political Family Ties
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Strictly limited to public officeholders and documented political roles; private
              family data is excluded.
            </p>
            {detail.familyRelationships.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {detail.familyRelationships.map((fam) => (
                  <li key={fam.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {fam.relativeName}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {fam.relationshipType}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                      {fam.publicRoleOrAffiliation}
                    </p>
                    <div className="mt-1">
                      <VerificationLabel status={fam.verificationStatus} compact />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No public political family affiliations documented.
              </p>
            )}
          </section>

          <section className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
              Political Career Timeline
            </h2>
            {detail.timeline.length > 0 ? (
              <ol className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {detail.timeline.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="w-16 shrink-0 font-mono text-xs font-semibold text-[#0F294A] tabular-nums dark:text-sky-400">
                      {ev.year}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {ev.category}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ev.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {ev.subtitle}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Timeline entries unavailable.
              </p>
            )}
          </section>
        </div>

        {/* 14 & 15: News / Statements & Sources / Verification */}
        <section className="border-b border-slate-200 p-6 sm:p-8 dark:border-slate-800">
          <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
            Relevant News &amp; Public Statements
          </h2>
          {detail.newsAndStatements.length > 0 ? (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {detail.newsAndStatements.map((n) => (
                <li key={n.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                    >
                      <span>{n.headline}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                    <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {n.publishedDate} · {n.publisher}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {n.statementOrSummary}
                  </p>
                  <div className="mt-1.5">
                    <VerificationLabel status={n.verificationStatus} compact />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              No archived public statements linked yet.
            </p>
          )}
        </section>

        <section className="bg-slate-50/80 p-6 sm:p-8 dark:bg-[#0D1420]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
              Sources, Citations &amp; Verification Audit
            </h2>
            <button
              type="button"
              onClick={() => setCorrectionOpen(true)}
              className="text-xs font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
            >
              Submit Source or Correction
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {detail.sources.map((src) => (
              <a
                key={src.id}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {src.title}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                    {src.publisher} · Published {src.publicationDate} · Collected {src.dateCollected}
                  </p>
                  <div className="mt-1.5">
                    <VerificationLabel status={src.verificationStatus} compact />
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </a>
            ))}
          </div>

          {detail.verificationRecords.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Verification Audit Notes
              </h3>
              <ul className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {detail.verificationRecords.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-2">
                    <VerificationLabel status={v.status} compact />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {v.fieldOrSection}:
                    </span>
                    <span>{v.claimSummary}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </article>

      <CorrectionModal
        isOpen={correctionOpen}
        entityType="politician"
        entityId={pol.id}
        entityLabel={pol.fullName}
        onClose={() => setCorrectionOpen(false)}
      />
    </section>
  );
}
