import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { LogOut, Shield, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PROVINCES, VERIFICATION_STATUSES } from '../utils/platformLogic';
import { VerificationLabel } from './VerificationLabel';

interface AdminWorkspacePayload {
  politicians: Array<{
    id: number;
    slug: string;
    fullName: string;
    honorific: string;
    photoUrl: string | null;
    province: string;
    currentPositionTitle: string;
    currentConstituencyCode: string;
    partyAbbreviation: string;
    verificationStatus: string;
    isFeatured: boolean;
    isPublished: boolean;
  }>;
  parties: Array<{
    id: number;
    name: string;
    abbreviation: string;
    foundedYear: number;
    currentLeadership: string;
    verificationStatus: string;
  }>;
  sources: Array<{
    id: number;
    title: string;
    publisher: string;
    url: string;
    verificationStatus: string;
  }>;
  corrections: Array<{
    id: number;
    entityType: string;
    entityId: number;
    entityLabel: string;
    sectionName: string;
    submittedClaim: string;
    suggestedCorrection: string;
    evidenceUrl: string | null;
    submitterName: string;
    submitterEmail: string;
    status: string;
    adminNotes: string | null;
    createdAt: string;
  }>;
  users: Array<{
    id: number;
    uid: string;
    email: string;
    displayName: string | null;
    role: string;
  }>;
  elections: Array<{ id: number; year: number; title: string }>;
  constituencies: Array<{ id: number; code: string; name: string; province: string }>;
  declarations: Array<{
    id: number;
    politicianName: string;
    declarationYear: number;
    totalDeclaredAssets: string;
    verificationStatus: string;
  }>;
}

type AdminTab =
  | 'politicians'
  | 'parties'
  | 'elections-assets'
  | 'sources'
  | 'corrections'
  | 'roles';

interface AdminDashboardProps {
  onDataChanged: () => void;
}

export function AdminDashboard({ onDataChanged }: AdminDashboardProps) {
  const { firebaseUser, dbUser, idToken, isLoading: authLoading, authError, signInWithGoogle, logout } =
    useAuth();

  const [workspace, setWorkspace] = useState<AdminWorkspacePayload | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('politicians');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Politician form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [polName, setPolName] = useState('');
  const [polHonorific, setPolHonorific] = useState('');
  const [polProvince, setPolProvince] = useState<string>('Punjab');
  const [polPartyId, setPolPartyId] = useState<string>('');
  const [polPosition, setPolPosition] = useState('');
  const [polConstituency, setPolConstituency] = useState('');
  const [polEducation, setPolEducation] = useState('');
  const [polDob, setPolDob] = useState('');
  const [polBirthPlace, setPolBirthPlace] = useState('');
  const [polBio, setPolBio] = useState('');
  const [polBusiness, setPolBusiness] = useState('');
  const [polPhotoUrl, setPolPhotoUrl] = useState('');
  const [polStatus, setPolStatus] = useState<string>('Reported, not independently verified');
  const [polFeatured, setPolFeatured] = useState(false);

  // Party form state
  const [partyName, setPartyName] = useState('');
  const [partyAbbrev, setPartyAbbrev] = useState('');
  const [partyYear, setPartyYear] = useState('2024');
  const [partyFounder, setPartyFounder] = useState('');
  const [partyCurrentLeader, setPartyCurrentLeader] = useState('');
  const [partyHq, setPartyHq] = useState('Islamabad');
  const [partyHistory, setPartyHistory] = useState('');

  // Election result & asset forms
  const [elElectionId, setElElectionId] = useState('');
  const [elConstituencyId, setElConstituencyId] = useState('');
  const [elPoliticianId, setElPoliticianId] = useState('');
  const [elCandidate, setElCandidate] = useState('');
  const [elPartyAbbrev, setElPartyAbbrev] = useState('');
  const [elVotes, setElVotes] = useState('');
  const [elWinner, setElWinner] = useState(true);

  const [declPolId, setDeclPolId] = useState('');
  const [declYear, setDeclYear] = useState('2024');
  const [declAssetsTotal, setDeclAssetsTotal] = useState('');
  const [declLiabTotal, setDeclLiabTotal] = useState('PKR 0');
  const [declSummary, setDeclSummary] = useState('');

  // Source & verification forms
  const [srcTitle, setSrcTitle] = useState('');
  const [srcUrl, setSrcUrl] = useState('');
  const [srcPublisher, setSrcPublisher] = useState('');
  const [srcDate, setSrcDate] = useState('2026-11-15');
  const [srcStatus, setSrcStatus] = useState<string>('Officially documented');

  const [verEntityId, setVerEntityId] = useState('');
  const [verStatus, setVerStatus] = useState<string>('Officially documented');
  const [verClaim, setVerClaim] = useState('');
  const [verNotes, setVerNotes] = useState('');

  const loadWorkspace = useCallback(async () => {
    if (!idToken) return;
    setLoadingWorkspace(true);
    setWorkspaceError(null);
    try {
      const res = await fetch('/api/admin/workspace', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setWorkspaceError(data.error ?? 'Unable to load administrator workspace.');
        setWorkspace(null);
        return;
      }
      setWorkspace(data as AdminWorkspacePayload);
    } catch {
      setWorkspaceError('Network error loading administrator workspace.');
    } finally {
      setLoadingWorkspace(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (idToken && (dbUser?.role === 'admin' || dbUser?.role === 'editor')) {
      void loadWorkspace();
    }
  }, [idToken, dbUser?.role, loadWorkspace]);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      setFeedback('Please choose an image smaller than 800 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPolPhotoUrl(reader.result);
        setFeedback('Profile photograph loaded for saving.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePoliticianSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    setFeedback(null);

    const endpoint = editingId
      ? `/api/admin/politicians/${editingId}`
      : '/api/admin/politicians';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fullName: polName,
        honorific: polHonorific || 'Public Representative',
        province: polProvince,
        currentPartyId: polPartyId ? Number(polPartyId) : null,
        currentPositionTitle: polPosition,
        currentConstituencyCode: polConstituency || 'Unavailable',
        education: polEducation || 'Unavailable',
        dateOfBirth: polDob || 'Unavailable',
        birthPlace: polBirthPlace || polProvince,
        biography: polBio || 'Public record entry compiled by editorial team.',
        businessInterestsSummary: polBusiness || 'Unavailable',
        photoUrl: polPhotoUrl || null,
        verificationStatus: polStatus,
        isFeatured: polFeatured,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback(data.error ?? 'Failed to save politician.');
      return;
    }

    setFeedback(editingId ? 'Politician profile updated.' : 'Politician profile created.');
    setEditingId(null);
    setPolName('');
    setPolHonorific('');
    setPolPosition('');
    setPolConstituency('');
    setPolBio('');
    setPolPhotoUrl('');
    await loadWorkspace();
    onDataChanged();
  };

  const handleTogglePublished = async (id: number, currentPublished: boolean) => {
    if (!idToken) return;
    const res = await fetch(`/api/admin/politicians/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ isPublished: !currentPublished }),
    });
    if (res.ok) {
      setFeedback(!currentPublished ? 'Profile published.' : 'Profile unpublished.');
      await loadWorkspace();
      onDataChanged();
    }
  };

  const handleCreateParty = async (e: FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    const res = await fetch('/api/admin/parties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        name: partyName,
        abbreviation: partyAbbrev,
        foundedYear: Number(partyYear),
        foundingLeadership: partyFounder,
        currentLeadership: partyCurrentLeader,
        headquarters: partyHq,
        politicalHistory: partyHistory,
        verificationStatus: 'Reported, not independently verified',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback(data.error ?? 'Failed to create political party.');
      return;
    }
    setFeedback('Political party added.');
    setPartyName('');
    setPartyAbbrev('');
    setPartyFounder('');
    setPartyCurrentLeader('');
    setPartyHistory('');
    await loadWorkspace();
    onDataChanged();
  };

  const handleCreateElectionResult = async (e: FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    const res = await fetch('/api/admin/election-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        electionId: Number(elElectionId),
        constituencyId: Number(elConstituencyId),
        politicianId: elPoliticianId ? Number(elPoliticianId) : null,
        candidateName: elCandidate,
        partyAbbreviation: elPartyAbbrev,
        votesReceived: Number(elVotes),
        isWinner: elWinner,
        winningCandidateName: elCandidate,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback(data.error ?? 'Failed to add election result.');
      return;
    }
    setFeedback('Election record saved.');
    setElCandidate('');
    setElVotes('');
    await loadWorkspace();
    onDataChanged();
  };

  const handleCreateAssetDecl = async (e: FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    const res = await fetch('/api/admin/asset-declarations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        politicianId: Number(declPolId),
        declarationYear: Number(declYear),
        totalDeclaredAssets: declAssetsTotal,
        totalDeclaredLiabilities: declLiabTotal,
        netDeclaredSummary: declSummary,
        currency: 'PKR',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback(data.error ?? 'Failed to add asset declaration.');
      return;
    }
    setFeedback('Financial declaration added.');
    setDeclAssetsTotal('');
    setDeclSummary('');
    await loadWorkspace();
    onDataChanged();
  };

  const handleCreateSource = async (e: FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    const res = await fetch('/api/admin/sources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        title: srcTitle,
        url: srcUrl,
        publisher: srcPublisher,
        publicationDate: srcDate,
        verificationStatus: srcStatus,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback(data.error ?? 'Failed to add source.');
      return;
    }
    setFeedback('Reference source added.');
    setSrcTitle('');
    setSrcUrl('');
    setSrcPublisher('');
    await loadWorkspace();
    onDataChanged();
  };

  const handleRecordVerification = async (e: FormEvent) => {
    e.preventDefault();
    if (!idToken || !verEntityId) return;
    const res = await fetch('/api/admin/verifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        entityType: 'politician',
        entityId: Number(verEntityId),
        fieldOrSection: 'Editorial Verification Audit',
        claimSummary: verClaim,
        status: verStatus,
        reviewerNotes: verNotes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback(data.error ?? 'Failed to record verification.');
      return;
    }
    setFeedback('Verification status updated and logged.');
    setVerClaim('');
    setVerNotes('');
    await loadWorkspace();
    onDataChanged();
  };

  const handleCorrectionDecision = async (
    id: number,
    status: 'approved' | 'resolved' | 'rejected',
  ) => {
    if (!idToken) return;
    const res = await fetch(`/api/admin/corrections/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        status,
        adminNotes: `Reviewed as ${status} via Admin Portal.`,
      }),
    });
    if (res.ok) {
      setFeedback(`Correction #${id} marked ${status}.`);
      await loadWorkspace();
      onDataChanged();
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    if (!idToken) return;
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setFeedback('User role updated.');
      await loadWorkspace();
    }
  };

  if (authLoading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-44 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </section>
    );
  }

  if (!firebaseUser) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14532D] dark:text-emerald-400">
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>Role-Based Editorial Access</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#0F294A] dark:text-white">
            PakPolitico Administrator Portal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Sign in with your Google account to manage politician profiles, political parties,
            election tallies, financial declarations, source verifications, and citizen-submitted
            corrections.
          </p>

          {authError && (
            <p role="alert" className="mt-4 text-sm font-medium text-rose-700 dark:text-rose-400">
              {authError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="mt-6 min-h-[46px] rounded-lg bg-[#0F294A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A5F] dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            Sign In with Google
          </button>
        </div>
      </section>
    );
  }

  const role = dbUser?.role ?? 'researcher';
  const isPrivileged = role === 'admin' || role === 'editor';

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
            Signed in as {dbUser?.email ?? firebaseUser.email} · Role:{' '}
            <span className="font-semibold text-[#14532D] dark:text-emerald-400">{role}</span>
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#0F294A] dark:text-white">
            Editorial &amp; Verification Console
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:self-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      {!isPrivileged ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Researcher Account Active
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Your account currently holds <span className="font-mono font-semibold">{role}</span>{' '}
            permissions. An administrator must promote your role to{' '}
            <span className="font-mono font-semibold">editor</span> or{' '}
            <span className="font-mono font-semibold">admin</span> to modify records.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
            {(
              [
                ['politicians', 'Politicians & Photos'],
                ['parties', 'Political Parties'],
                ['elections-assets', 'Elections & Financials'],
                ['sources', 'Sources & Verification'],
                ['corrections', 'Corrections Queue'],
                ...(role === 'admin' ? [['roles', 'User Roles'] as const] : []),
              ] as Array<[AdminTab, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`min-h-[40px] rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap ${
                  activeTab === id
                    ? 'border-[#0F294A] bg-[#0F294A] text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {feedback && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-[#14532D] dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              {feedback}
            </p>
          )}

          {workspaceError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
            >
              {workspaceError}
            </p>
          )}

          {loadingWorkspace || !workspace ? (
            <div className="mt-6 h-56 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ) : activeTab === 'politicians' ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-12">
              <form
                onSubmit={handlePoliticianSubmit}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                    {editingId ? `Edit Politician #${editingId}` : 'Add Politician Profile'}
                  </h2>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setPolName('');
                        setPolPosition('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    required
                    value={polName}
                    onChange={(e) => setPolName(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Province *
                    </label>
                    <select
                      value={polProvince}
                      onChange={(e) => setPolProvince(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      {PROVINCES.filter((p) => p !== 'All Provinces').map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Political Party
                    </label>
                    <select
                      value={polPartyId}
                      onChange={(e) => setPolPartyId(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">Independent</option>
                      {workspace.parties.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.abbreviation} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Current Position *
                    </label>
                    <input
                      required
                      value={polPosition}
                      onChange={(e) => setPolPosition(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Constituency Code
                    </label>
                    <input
                      value={polConstituency}
                      onChange={(e) => setPolConstituency(e.target.value)}
                      placeholder="e.g. NA-48"
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Honorific / Title
                    </label>
                    <input
                      value={polHonorific}
                      onChange={(e) => setPolHonorific(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Date of Birth
                    </label>
                    <input
                      value={polDob}
                      onChange={(e) => setPolDob(e.target.value)}
                      placeholder="YYYY-MM-DD or Unavailable"
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Education &amp; Birthplace
                  </label>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    <input
                      value={polEducation}
                      onChange={(e) => setPolEducation(e.target.value)}
                      placeholder="Education"
                      className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                    <input
                      value={polBirthPlace}
                      onChange={(e) => setPolBirthPlace(e.target.value)}
                      placeholder="Birthplace"
                      className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Profile Photograph (Upload or URL)
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={polPhotoUrl}
                      onChange={(e) => setPolPhotoUrl(e.target.value)}
                      placeholder="Image URL or upload file..."
                      className="min-h-[40px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    />
                    <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Biography
                  </label>
                  <textarea
                    rows={3}
                    value={polBio}
                    onChange={(e) => setPolBio(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Verification Status
                    </label>
                    <select
                      value={polStatus}
                      onChange={(e) => setPolStatus(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    >
                      {VERIFICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={polFeatured}
                      onChange={(e) => setPolFeatured(e.target.checked)}
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#0F294A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A5F]"
                >
                  {editingId ? 'Save Profile Changes' : 'Create Politician Profile'}
                </button>
              </form>

              <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Managed Politician Records ({workspace.politicians.length})
                </h2>
                <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {workspace.politicians.map((pol) => (
                    <li
                      key={pol.id}
                      className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {pol.fullName}{' '}
                          <span className="font-mono text-xs text-slate-500">
                            ({pol.partyAbbreviation} · {pol.currentConstituencyCode})
                          </span>
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                          <VerificationLabel status={pol.verificationStatus} compact />
                          <span className="text-slate-500">
                            {pol.isPublished ? 'Published' : 'Unpublished'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(pol.id);
                            setPolName(pol.fullName);
                            setPolHonorific(pol.honorific);
                            setPolProvince(pol.province);
                            setPolPosition(pol.currentPositionTitle);
                            setPolConstituency(pol.currentConstituencyCode);
                            setPolPhotoUrl(pol.photoUrl ?? '');
                            setPolStatus(pol.verificationStatus);
                            setPolFeatured(pol.isFeatured);
                          }}
                          className="min-h-[34px] rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTogglePublished(pol.id, pol.isPublished)}
                          className="min-h-[34px] rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                        >
                          {pol.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : activeTab === 'parties' ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleCreateParty}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Add Political Party
                </h2>
                <input
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="Official Party Name *"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    value={partyAbbrev}
                    onChange={(e) => setPartyAbbrev(e.target.value)}
                    placeholder="Abbreviation *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    required
                    type="number"
                    value={partyYear}
                    onChange={(e) => setPartyYear(e.target.value)}
                    placeholder="Founded Year *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <input
                  value={partyFounder}
                  onChange={(e) => setPartyFounder(e.target.value)}
                  placeholder="Founding Leadership"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <input
                  value={partyCurrentLeader}
                  onChange={(e) => setPartyCurrentLeader(e.target.value)}
                  placeholder="Current Leadership"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <input
                  value={partyHq}
                  onChange={(e) => setPartyHq(e.target.value)}
                  placeholder="Headquarters"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <textarea
                  rows={3}
                  value={partyHistory}
                  onChange={(e) => setPartyHistory(e.target.value)}
                  placeholder="Political history summary..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#0F294A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A5F]"
                >
                  Add Political Party
                </button>
              </form>

              <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Registered Parties ({workspace.parties.length})
                </h2>
                <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {workspace.parties.map((p) => (
                    <li key={p.id} className="py-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {p.name} ({p.abbreviation})
                        </span>
                        <span className="font-mono text-xs text-slate-500">Est. {p.foundedYear}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {p.currentLeadership}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : activeTab === 'elections-assets' ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <form
                onSubmit={handleCreateElectionResult}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Add Election Result Record
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    required
                    value={elElectionId}
                    onChange={(e) => setElElectionId(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Select Election *</option>
                    {workspace.elections.map((el) => (
                      <option key={el.id} value={String(el.id)}>
                        {el.year} — {el.title}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    value={elConstituencyId}
                    onChange={(e) => setElConstituencyId(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Select Constituency *</option>
                    {workspace.constituencies.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.code} — {c.name} ({c.province})
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={elPoliticianId}
                  onChange={(e) => setElPoliticianId(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">Link to Politician Profile (optional)</option>
                  {workspace.politicians.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.fullName}
                    </option>
                  ))}
                </select>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    required
                    value={elCandidate}
                    onChange={(e) => setElCandidate(e.target.value)}
                    placeholder="Candidate Name *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    required
                    value={elPartyAbbrev}
                    onChange={(e) => setElPartyAbbrev(e.target.value)}
                    placeholder="Party (e.g. PPP) *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    required
                    type="number"
                    value={elVotes}
                    onChange={(e) => setElVotes(e.target.value)}
                    placeholder="Votes *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={elWinner}
                    onChange={(e) => setElWinner(e.target.checked)}
                  />
                  <span>Declared Winner</span>
                </label>

                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#0F294A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A5F]"
                >
                  Save Election Record
                </button>
              </form>

              <form
                onSubmit={handleCreateAssetDecl}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Add Financial Declaration
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    required
                    value={declPolId}
                    onChange={(e) => setDeclPolId(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Select Politician *</option>
                    {workspace.politicians.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    value={declYear}
                    onChange={(e) => setDeclYear(e.target.value)}
                    placeholder="Declaration Year *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    value={declAssetsTotal}
                    onChange={(e) => setDeclAssetsTotal(e.target.value)}
                    placeholder="Declared Assets (e.g. PKR 120.4M) *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    value={declLiabTotal}
                    onChange={(e) => setDeclLiabTotal(e.target.value)}
                    placeholder="Declared Liabilities"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <textarea
                  rows={3}
                  value={declSummary}
                  onChange={(e) => setDeclSummary(e.target.value)}
                  placeholder="Disclosure summary & source citation notes..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#166534]"
                >
                  Save Asset Declaration
                </button>
              </form>
            </div>
          ) : activeTab === 'sources' ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <form
                onSubmit={handleCreateSource}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Add Source &amp; Citation
                </h2>
                <input
                  required
                  value={srcTitle}
                  onChange={(e) => setSrcTitle(e.target.value)}
                  placeholder="Source Title *"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <input
                  required
                  type="url"
                  value={srcUrl}
                  onChange={(e) => setSrcUrl(e.target.value)}
                  placeholder="https://ecp.gov.pk/..."
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    value={srcPublisher}
                    onChange={(e) => setSrcPublisher(e.target.value)}
                    placeholder="Publisher / Institution *"
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    required
                    type="date"
                    value={srcDate}
                    onChange={(e) => setSrcDate(e.target.value)}
                    className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <select
                  value={srcStatus}
                  onChange={(e) => setSrcStatus(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  {VERIFICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#0F294A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A5F]"
                >
                  Add Reference Source
                </button>
              </form>

              <form
                onSubmit={handleRecordVerification}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                  Verify Politician Information
                </h2>
                <select
                  required
                  value={verEntityId}
                  onChange={(e) => setVerEntityId(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">Select Politician *</option>
                  {workspace.politicians.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
                <select
                  value={verStatus}
                  onChange={(e) => setVerStatus(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  {VERIFICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  required
                  value={verClaim}
                  onChange={(e) => setVerClaim(e.target.value)}
                  placeholder="Verified claim summary *"
                  className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <textarea
                  rows={2}
                  value={verNotes}
                  onChange={(e) => setVerNotes(e.target.value)}
                  placeholder="Reviewer notes..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#166534]"
                >
                  Log Verification Decision
                </button>
              </form>
            </div>
          ) : activeTab === 'corrections' ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                User-Submitted Corrections Queue ({workspace.corrections.length})
              </h2>
              <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {workspace.corrections.map((c) => (
                  <li key={c.id} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {c.entityLabel} — {c.sectionName}
                      </p>
                      <span className="font-mono text-xs font-semibold uppercase text-[#0F294A] dark:text-sky-400">
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Submitted by {c.submitterName} ({c.submitterEmail})
                    </p>
                    <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Flagged Claim: </span>
                      {c.submittedClaim}
                    </p>
                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Suggested Correction: </span>
                      {c.suggestedCorrection}
                    </p>
                    {c.evidenceUrl && (
                      <p className="mt-1 text-xs">
                        <a
                          href={c.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#0F294A] hover:underline dark:text-sky-400"
                        >
                          Evidence: {c.evidenceUrl}
                        </a>
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCorrectionDecision(c.id, 'approved')}
                        className="min-h-[34px] rounded-md bg-[#14532D] px-3 py-1 text-xs font-semibold text-white hover:bg-[#166534]"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCorrectionDecision(c.id, 'resolved')}
                        className="min-h-[34px] rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                      >
                        Mark Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCorrectionDecision(c.id, 'rejected')}
                        className="min-h-[34px] rounded-md border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-display text-xl font-semibold text-[#0F294A] dark:text-white">
                Platform Role Permissions
              </h2>
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {workspace.users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{u.email}</p>
                      <p className="text-xs text-slate-500">{u.displayName ?? 'Platform User'}</p>
                    </div>
                    <select
                      value={u.role}
                      onChange={(e) => void handleRoleChange(u.id, e.target.value)}
                      className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="researcher">researcher</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
