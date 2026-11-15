import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PROVINCES } from '../utils/platformLogic';
import { VerificationLabel } from './VerificationLabel';

export interface ElectionRecordRow {
  id: number;
  electionYear: number;
  electionTitle: string;
  constituencyCode: string;
  constituencyName: string;
  province: string;
  assemblyType: string;
  politicianSlug: string | null;
  candidateName: string;
  partyAbbreviation: string;
  votesReceived: number;
  totalValidVotes: number | null;
  isWinner: boolean;
  winningCandidateName: string;
  resultStatus: string;
  verificationStatus: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
  isDemoData: boolean;
}

interface ElectionsViewProps {
  records: ElectionRecordRow[];
  isLoading: boolean;
  onOpenPolitician: (slug: string) => void;
}

export function ElectionsView({
  records,
  isLoading,
  onOpenPolitician,
}: ElectionsViewProps) {
  const [yearFilter, setYearFilter] = useState('All');
  const [provinceFilter, setProvinceFilter] = useState('All Provinces');
  const [partyFilter, setPartyFilter] = useState('All');
  const [constituencyQuery, setConstituencyQuery] = useState('');

  const years = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.electionYear))).sort((a, b) => b - a),
    [records],
  );

  const parties = useMemo(
    () => Array.from(new Set(records.map((r) => r.partyAbbreviation))).sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const q = constituencyQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (yearFilter !== 'All' && String(r.electionYear) !== yearFilter) return false;
      if (provinceFilter !== 'All Provinces' && r.province !== provinceFilter) return false;
      if (partyFilter !== 'All' && r.partyAbbreviation !== partyFilter) return false;
      if (
        q &&
        !`${r.constituencyCode} ${r.constituencyName} ${r.candidateName}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [records, yearFilter, provinceFilter, partyFilter, constituencyQuery]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <p className="text-xs font-semibold tracking-wide text-[#14532D] dark:text-emerald-400">
          ECP Form-47 / Form-49 Demonstration Archive
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-[#0F294A] dark:text-white">
          Constituency &amp; Election Records
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Filter documented election contests by year, province, constituency, and political party.
        </p>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label
            htmlFor="el-year"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Election Year
          </label>
          <select
            id="el-year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Years</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="el-province"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Province
          </label>
          <select
            id="el-province"
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="el-party"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Political Party
          </label>
          <select
            id="el-party"
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Parties</option>
            {parties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="el-const"
            className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Constituency or Candidate
          </label>
          <input
            id="el-const"
            type="search"
            value={constituencyQuery}
            onChange={(e) => setConstituencyQuery(e.target.value)}
            placeholder="e.g. NA-194 or Larkana..."
            className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      <p className="mt-5 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
        {filtered.length} matching election records
      </p>

      {isLoading ? (
        <div className="mt-4 h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <th scope="col" className="px-4 py-3">Year</th>
                <th scope="col" className="px-4 py-3">Constituency</th>
                <th scope="col" className="px-4 py-3">Candidate</th>
                <th scope="col" className="px-4 py-3">Party</th>
                <th scope="col" className="px-4 py-3 text-right">Votes</th>
                <th scope="col" className="px-4 py-3">Result &amp; Winner</th>
                <th scope="col" className="px-4 py-3">Source &amp; Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-900 tabular-nums dark:text-white">
                    {row.electionYear}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs font-semibold text-[#0F294A] dark:text-sky-400">
                      {row.constituencyCode} · {row.constituencyName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {row.province} · {row.assemblyType}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    {row.politicianSlug ? (
                      <button
                        type="button"
                        onClick={() => onOpenPolitician(row.politicianSlug!)}
                        className="font-semibold text-[#0F294A] hover:underline dark:text-sky-400"
                      >
                        {row.candidateName}
                      </button>
                    ) : (
                      <span className="font-medium text-slate-900 dark:text-white">
                        {row.candidateName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {row.partyAbbreviation}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {row.votesReceived.toLocaleString('en-US')}
                    {row.totalValidVotes ? (
                      <span className="block font-normal text-slate-500 dark:text-slate-400">
                        / {row.totalValidVotes.toLocaleString('en-US')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-[#14532D] dark:text-emerald-400">
                      {row.resultStatus}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Winner: {row.winningCandidateName}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <VerificationLabel status={row.verificationStatus} compact />
                    {row.sourceUrl && (
                      <a
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:underline dark:text-slate-400"
                      >
                        <span>{row.sourceTitle ?? 'Official Source'}</span>
                        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
