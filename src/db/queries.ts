import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  assetDeclarations,
  assets,
  constituencies,
  correctionRequests,
  electionResults,
  elections,
  familyRelationships,
  liabilities,
  newsAndStatements,
  parliamentaryRecords,
  partyMemberships,
  politicalParties,
  politicalPositions,
  politicians,
  sources,
  users,
  verificationRecords,
} from './schema.ts';
import { ensureDatabaseSeeded } from './seed.ts';
import {
  buildCareerTimeline,
  slugifyText,
  type PoliticianDirectoryItem,
} from '../utils/platformLogic.ts';

function dbError(message: string, cause: unknown): Error {
  console.error(message, cause);
  return new Error(message, { cause });
}

export async function getPlatformOverview() {
  try {
    await ensureDatabaseSeeded();

    const [
      allPoliticians,
      allParties,
      allResults,
      allDeclarations,
      allParliament,
      allSources,
      recentCorrections,
    ] = await Promise.all([
      db.select().from(politicians).where(eq(politicians.isPublished, true)).orderBy(desc(politicians.updatedAt)),
      db.select().from(politicalParties).where(eq(politicalParties.isPublished, true)).orderBy(politicalParties.name),
      db
        .select({
          id: electionResults.id,
          year: elections.year,
          constituencyCode: constituencies.code,
          province: constituencies.province,
          candidateName: electionResults.candidateName,
          partyAbbreviation: electionResults.partyAbbreviation,
          votesReceived: electionResults.votesReceived,
          resultStatus: electionResults.resultStatus,
          verificationStatus: electionResults.verificationStatus,
        })
        .from(electionResults)
        .innerJoin(elections, eq(electionResults.electionId, elections.id))
        .innerJoin(constituencies, eq(electionResults.constituencyId, constituencies.id))
        .orderBy(desc(elections.year), desc(electionResults.votesReceived))
        .limit(8),
      db.select({ count: sql<number>`count(*)::int` }).from(assetDeclarations),
      db.select({ count: sql<number>`count(*)::int` }).from(parliamentaryRecords),
      db.select().from(sources).orderBy(desc(sources.id)),
      db.select().from(correctionRequests).orderBy(desc(correctionRequests.createdAt)).limit(5),
    ]);

    const partyMap = new Map(allParties.map((p) => [p.id, p]));
    const provinceCounts = new Map<string, number>();
    for (const pol of allPoliticians) {
      provinceCounts.set(pol.province, (provinceCounts.get(pol.province) ?? 0) + 1);
    }

    const featured = allPoliticians
      .filter((p) => p.isFeatured)
      .slice(0, 6)
      .map((p) => ({
        ...p,
        partyName: p.currentPartyId ? partyMap.get(p.currentPartyId)?.name ?? 'Independent' : 'Independent',
        partyAbbreviation: p.currentPartyId ? partyMap.get(p.currentPartyId)?.abbreviation ?? 'IND' : 'IND',
      }));

    const recentlyAdded = allPoliticians.slice(0, 5).map((p) => ({
      ...p,
      partyName: p.currentPartyId ? partyMap.get(p.currentPartyId)?.name ?? 'Independent' : 'Independent',
      partyAbbreviation: p.currentPartyId ? partyMap.get(p.currentPartyId)?.abbreviation ?? 'IND' : 'IND',
    }));

    return {
      stats: {
        politiciansCount: allPoliticians.length,
        partiesCount: allParties.length,
        electionRecordsCount: allResults.length,
        assetDeclarationsCount: allDeclarations[0]?.count ?? 0,
        parliamentaryRecordsCount: allParliament[0]?.count ?? 0,
        verifiedSourcesCount: allSources.length,
      },
      featuredPoliticians: featured,
      recentlyAddedPoliticians: recentlyAdded,
      parties: allParties,
      provinceBreakdown: Array.from(provinceCounts.entries()).map(([province, count]) => ({
        province,
        count,
      })),
      latestUpdates: allResults.slice(0, 5).map((r) => ({
        id: r.id,
        title: `${r.year} ${r.constituencyCode} (${r.province}) — ${r.candidateName}`,
        detail: `${r.partyAbbreviation} · ${r.votesReceived.toLocaleString('en-US')} votes · ${r.resultStatus}`,
        verificationStatus: r.verificationStatus,
      })),
      recentCorrectionsCount: recentCorrections.filter((c) => c.status === 'pending').length,
    };
  } catch (error) {
    throw dbError('Failed to load platform overview.', error);
  }
}

export async function getPoliticiansDirectory(includeUnpublished = false): Promise<PoliticianDirectoryItem[]> {
  try {
    await ensureDatabaseSeeded();

    const rows = includeUnpublished
      ? await db.select().from(politicians).orderBy(politicians.fullName)
      : await db
          .select()
          .from(politicians)
          .where(eq(politicians.isPublished, true))
          .orderBy(politicians.fullName);

    const [partiesList, electionRows] = await Promise.all([
      db.select().from(politicalParties),
      db
        .select({
          politicianId: electionResults.politicianId,
          year: elections.year,
        })
        .from(electionResults)
        .innerJoin(elections, eq(electionResults.electionId, elections.id)),
    ]);

    const partyMap = new Map(partiesList.map((p) => [p.id, p]));
    const yearsByPol = new Map<number, Set<number>>();
    for (const row of electionRows) {
      if (row.politicianId != null) {
        if (!yearsByPol.has(row.politicianId)) {
          yearsByPol.set(row.politicianId, new Set());
        }
        yearsByPol.get(row.politicianId)!.add(row.year);
      }
    }

    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      honorific: p.honorific,
      photoUrl: p.photoUrl,
      province: p.province,
      currentPositionTitle: p.currentPositionTitle,
      currentConstituencyCode: p.currentConstituencyCode,
      partyName: p.currentPartyId ? partyMap.get(p.currentPartyId)?.name ?? 'Independent' : 'Independent',
      partyAbbreviation: p.currentPartyId ? partyMap.get(p.currentPartyId)?.abbreviation ?? 'IND' : 'IND',
      verificationStatus: p.verificationStatus,
      isFeatured: p.isFeatured,
      isDemoData: p.isDemoData,
      isPublished: p.isPublished,
      electionYears: Array.from(yearsByPol.get(p.id) ?? []),
      updatedAt: p.updatedAt.toISOString(),
    }));
  } catch (error) {
    throw dbError('Failed to load politicians directory.', error);
  }
}

export async function getPoliticianDetailBySlug(slug: string) {
  try {
    await ensureDatabaseSeeded();

    const found = await db
      .select()
      .from(politicians)
      .where(eq(politicians.slug, slug))
      .limit(1);

    if (found.length === 0) {
      return null;
    }

    const pol = found[0];
    const [
      partyRow,
      memberships,
      positions,
      electionsJoined,
      declarations,
      polAssets,
      polLiabilities,
      parliament,
      family,
      news,
      verifications,
      allSources,
    ] = await Promise.all([
      pol.currentPartyId
        ? db.select().from(politicalParties).where(eq(politicalParties.id, pol.currentPartyId)).limit(1)
        : Promise.resolve([]),
      db
        .select({
          id: partyMemberships.id,
          partyId: partyMemberships.partyId,
          partyName: politicalParties.name,
          partyAbbreviation: politicalParties.abbreviation,
          partySlug: politicalParties.slug,
          roleInParty: partyMemberships.roleInParty,
          startDate: partyMemberships.startDate,
          endDate: partyMemberships.endDate,
          isCurrent: partyMemberships.isCurrent,
          notes: partyMemberships.notes,
          verificationStatus: partyMemberships.verificationStatus,
          sourceId: partyMemberships.sourceId,
        })
        .from(partyMemberships)
        .innerJoin(politicalParties, eq(partyMemberships.partyId, politicalParties.id))
        .where(eq(partyMemberships.politicianId, pol.id)),
      db.select().from(politicalPositions).where(eq(politicalPositions.politicianId, pol.id)),
      db
        .select({
          id: electionResults.id,
          year: elections.year,
          electionTitle: elections.title,
          constituencyCode: constituencies.code,
          constituencyName: constituencies.name,
          province: constituencies.province,
          assemblyType: constituencies.assemblyType,
          partyAbbreviation: electionResults.partyAbbreviation,
          votesReceived: electionResults.votesReceived,
          totalValidVotes: electionResults.totalValidVotes,
          isWinner: electionResults.isWinner,
          winningCandidateName: electionResults.winningCandidateName,
          resultStatus: electionResults.resultStatus,
          verificationStatus: electionResults.verificationStatus,
          sourceId: electionResults.sourceId,
          isDemoData: electionResults.isDemoData,
        })
        .from(electionResults)
        .innerJoin(elections, eq(electionResults.electionId, elections.id))
        .innerJoin(constituencies, eq(electionResults.constituencyId, constituencies.id))
        .where(eq(electionResults.politicianId, pol.id))
        .orderBy(desc(elections.year)),
      db
        .select()
        .from(assetDeclarations)
        .where(eq(assetDeclarations.politicianId, pol.id))
        .orderBy(desc(assetDeclarations.declarationYear)),
      db.select().from(assets).where(eq(assets.politicianId, pol.id)),
      db.select().from(liabilities).where(eq(liabilities.politicianId, pol.id)),
      db.select().from(parliamentaryRecords).where(eq(parliamentaryRecords.politicianId, pol.id)),
      db.select().from(familyRelationships).where(eq(familyRelationships.politicianId, pol.id)),
      db.select().from(newsAndStatements).where(eq(newsAndStatements.politicianId, pol.id)),
      db
        .select()
        .from(verificationRecords)
        .where(
          and(
            eq(verificationRecords.entityType, 'politician'),
            eq(verificationRecords.entityId, pol.id),
          ),
        ),
      db.select().from(sources),
    ]);

    const sourceIds = new Set<number>();
    for (const m of memberships) if (m.sourceId) sourceIds.add(m.sourceId);
    for (const p of positions) if (p.sourceId) sourceIds.add(p.sourceId);
    for (const e of electionsJoined) if (e.sourceId) sourceIds.add(e.sourceId);
    for (const d of declarations) if (d.sourceId) sourceIds.add(d.sourceId);
    for (const pr of parliament) if (pr.sourceId) sourceIds.add(pr.sourceId);
    for (const f of family) if (f.sourceId) sourceIds.add(f.sourceId);
    for (const v of verifications) if (v.sourceId) sourceIds.add(v.sourceId);

    const referencedSources = allSources.filter((s) => sourceIds.has(s.id));
    const uniqueConstituencies = Array.from(
      new Map(
        electionsJoined.map((e) => [
          e.constituencyCode,
          {
            code: e.constituencyCode,
            name: e.constituencyName,
            province: e.province,
            assemblyType: e.assemblyType,
          },
        ]),
      ).values(),
    );

    const timeline = buildCareerTimeline({
      positions,
      memberships,
      elections: electionsJoined,
    });

    return {
      politician: {
        ...pol,
        currentParty: partyRow[0] ?? null,
      },
      partyMemberships: memberships,
      positions,
      elections: electionsJoined,
      constituenciesRepresented: uniqueConstituencies,
      assetDeclarations: declarations.map((d) => ({
        ...d,
        assets: polAssets.filter((a) => a.declarationId === d.id),
        liabilities: polLiabilities.filter((l) => l.declarationId === d.id),
      })),
      parliamentaryRecords: parliament,
      familyRelationships: family,
      newsAndStatements: news,
      verificationRecords: verifications,
      sources: referencedSources.length > 0 ? referencedSources : allSources.slice(0, 3),
      timeline,
    };
  } catch (error) {
    throw dbError('Failed to load politician profile.', error);
  }
}

export async function getPartiesDirectory() {
  try {
    await ensureDatabaseSeeded();
    const [partiesList, pols, electionRows] = await Promise.all([
      db.select().from(politicalParties).orderBy(politicalParties.name),
      db.select().from(politicians).where(eq(politicians.isPublished, true)),
      db.select().from(electionResults),
    ]);

    return partiesList.map((party) => {
      const members = pols.filter((p) => p.currentPartyId === party.id);
      const seatsWon = electionRows.filter(
        (r) => r.partyId === party.id && r.isWinner,
      ).length;
      return {
        ...party,
        documentedMembersCount: members.length,
        documentedElectionWins: seatsWon,
        featuredMembers: members.map((m) => ({
          id: m.id,
          slug: m.slug,
          fullName: m.fullName,
          currentPositionTitle: m.currentPositionTitle,
          province: m.province,
        })),
      };
    });
  } catch (error) {
    throw dbError('Failed to load political parties directory.', error);
  }
}

export async function getPartyDetailBySlug(slug: string) {
  try {
    await ensureDatabaseSeeded();
    const found = await db
      .select()
      .from(politicalParties)
      .where(eq(politicalParties.slug, slug))
      .limit(1);

    if (found.length === 0) return null;
    const party = found[0];

    const [members, results, partySource] = await Promise.all([
      db.select().from(politicians).where(eq(politicians.currentPartyId, party.id)),
      db
        .select({
          id: electionResults.id,
          year: elections.year,
          constituencyCode: constituencies.code,
          constituencyName: constituencies.name,
          province: constituencies.province,
          candidateName: electionResults.candidateName,
          votesReceived: electionResults.votesReceived,
          isWinner: electionResults.isWinner,
          resultStatus: electionResults.resultStatus,
          verificationStatus: electionResults.verificationStatus,
        })
        .from(electionResults)
        .innerJoin(elections, eq(electionResults.electionId, elections.id))
        .innerJoin(constituencies, eq(electionResults.constituencyId, constituencies.id))
        .where(eq(electionResults.partyId, party.id))
        .orderBy(desc(elections.year)),
      party.sourceId
        ? db.select().from(sources).where(eq(sources.id, party.sourceId)).limit(1)
        : Promise.resolve([]),
    ]);

    return {
      party,
      members,
      electionHistory: results,
      source: partySource[0] ?? null,
    };
  } catch (error) {
    throw dbError('Failed to load party detail.', error);
  }
}

export async function getElectionRecords() {
  try {
    await ensureDatabaseSeeded();

    const rows = await db
      .select({
        id: electionResults.id,
        electionYear: elections.year,
        electionTitle: elections.title,
        constituencyCode: constituencies.code,
        constituencyName: constituencies.name,
        province: constituencies.province,
        assemblyType: constituencies.assemblyType,
        politicianSlug: politicians.slug,
        candidateName: electionResults.candidateName,
        partyAbbreviation: electionResults.partyAbbreviation,
        votesReceived: electionResults.votesReceived,
        totalValidVotes: electionResults.totalValidVotes,
        isWinner: electionResults.isWinner,
        winningCandidateName: electionResults.winningCandidateName,
        resultStatus: electionResults.resultStatus,
        verificationStatus: electionResults.verificationStatus,
        sourceTitle: sources.title,
        sourceUrl: sources.url,
        isDemoData: electionResults.isDemoData,
      })
      .from(electionResults)
      .innerJoin(elections, eq(electionResults.electionId, elections.id))
      .innerJoin(constituencies, eq(electionResults.constituencyId, constituencies.id))
      .leftJoin(politicians, eq(electionResults.politicianId, politicians.id))
      .leftJoin(sources, eq(electionResults.sourceId, sources.id))
      .orderBy(desc(elections.year), desc(electionResults.votesReceived));

    return rows;
  } catch (error) {
    throw dbError('Failed to load election records.', error);
  }
}

export async function getFinancialTransparencyRecords() {
  try {
    await ensureDatabaseSeeded();

    const [decls, assetRows, liabilityRows] = await Promise.all([
      db
        .select({
          id: assetDeclarations.id,
          politicianId: assetDeclarations.politicianId,
          politicianName: politicians.fullName,
          politicianSlug: politicians.slug,
          province: politicians.province,
          declarationYear: assetDeclarations.declarationYear,
          fiscalYearLabel: assetDeclarations.fiscalYearLabel,
          currency: assetDeclarations.currency,
          totalDeclaredAssets: assetDeclarations.totalDeclaredAssets,
          totalDeclaredLiabilities: assetDeclarations.totalDeclaredLiabilities,
          netDeclaredSummary: assetDeclarations.netDeclaredSummary,
          filingAuthority: assetDeclarations.filingAuthority,
          verificationStatus: assetDeclarations.verificationStatus,
          sourceTitle: sources.title,
          sourceUrl: sources.url,
          isDemoData: assetDeclarations.isDemoData,
        })
        .from(assetDeclarations)
        .innerJoin(politicians, eq(assetDeclarations.politicianId, politicians.id))
        .leftJoin(sources, eq(assetDeclarations.sourceId, sources.id))
        .orderBy(desc(assetDeclarations.declarationYear), politicians.fullName),
      db.select().from(assets),
      db.select().from(liabilities),
    ]);

    return decls.map((d) => ({
      ...d,
      assets: assetRows.filter((a) => a.declarationId === d.id),
      liabilities: liabilityRows.filter((l) => l.declarationId === d.id),
    }));
  } catch (error) {
    throw dbError('Failed to load financial transparency records.', error);
  }
}

export async function getParliamentaryRecordsList() {
  try {
    await ensureDatabaseSeeded();

    return await db
      .select({
        id: parliamentaryRecords.id,
        politicianId: parliamentaryRecords.politicianId,
        politicianName: politicians.fullName,
        politicianSlug: politicians.slug,
        province: politicians.province,
        termLabel: parliamentaryRecords.termLabel,
        assemblyName: parliamentaryRecords.assemblyName,
        sessionsAttended: parliamentaryRecords.sessionsAttended,
        totalSessions: parliamentaryRecords.totalSessions,
        questionsSubmitted: parliamentaryRecords.questionsSubmitted,
        billsIntroduced: parliamentaryRecords.billsIntroduced,
        speechesDelivered: parliamentaryRecords.speechesDelivered,
        votingParticipationPct: parliamentaryRecords.votingParticipationPct,
        committeeMemberships: parliamentaryRecords.committeeMemberships,
        notableActivitySummary: parliamentaryRecords.notableActivitySummary,
        verificationStatus: parliamentaryRecords.verificationStatus,
        sourceTitle: sources.title,
        sourceUrl: sources.url,
        isDemoData: parliamentaryRecords.isDemoData,
      })
      .from(parliamentaryRecords)
      .innerJoin(politicians, eq(parliamentaryRecords.politicianId, politicians.id))
      .leftJoin(sources, eq(parliamentaryRecords.sourceId, sources.id))
      .orderBy(desc(parliamentaryRecords.sessionsAttended));
  } catch (error) {
    throw dbError('Failed to load parliamentary performance records.', error);
  }
}

export async function getSourcesAndVerifications() {
  try {
    await ensureDatabaseSeeded();

    const [allSources, allVerifications] = await Promise.all([
      db.select().from(sources).orderBy(desc(sources.id)),
      db.select().from(verificationRecords).orderBy(desc(verificationRecords.verifiedAt)),
    ]);

    return {
      sources: allSources,
      verifications: allVerifications,
    };
  } catch (error) {
    throw dbError('Failed to load sources and verification logs.', error);
  }
}

export async function createCorrectionRequest(input: {
  entityType: string;
  entityId: number;
  entityLabel: string;
  sectionName: string;
  submittedClaim: string;
  suggestedCorrection: string;
  evidenceUrl?: string;
  submitterName: string;
  submitterEmail: string;
}) {
  try {
    const inserted = await db
      .insert(correctionRequests)
      .values({
        entityType: input.entityType.trim(),
        entityId: input.entityId,
        entityLabel: input.entityLabel.trim(),
        sectionName: input.sectionName.trim(),
        submittedClaim: input.submittedClaim.trim(),
        suggestedCorrection: input.suggestedCorrection.trim(),
        evidenceUrl: input.evidenceUrl?.trim() || null,
        submitterName: input.submitterName.trim(),
        submitterEmail: input.submitterEmail.trim(),
        status: 'pending',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    throw dbError('Failed to submit correction request.', error);
  }
}

export async function getAdminWorkspaceData() {
  try {
    await ensureDatabaseSeeded();

    const [
      allPoliticians,
      allParties,
      allSources,
      allCorrections,
      allUsers,
      allElections,
      allConstituencies,
      allDeclarations,
    ] = await Promise.all([
      getPoliticiansDirectory(true),
      db.select().from(politicalParties).orderBy(politicalParties.name),
      db.select().from(sources).orderBy(desc(sources.id)),
      db.select().from(correctionRequests).orderBy(desc(correctionRequests.createdAt)),
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(elections).orderBy(desc(elections.year)),
      db.select().from(constituencies).orderBy(constituencies.code),
      db
        .select({
          id: assetDeclarations.id,
          politicianId: assetDeclarations.politicianId,
          politicianName: politicians.fullName,
          declarationYear: assetDeclarations.declarationYear,
          fiscalYearLabel: assetDeclarations.fiscalYearLabel,
          totalDeclaredAssets: assetDeclarations.totalDeclaredAssets,
          verificationStatus: assetDeclarations.verificationStatus,
        })
        .from(assetDeclarations)
        .innerJoin(politicians, eq(assetDeclarations.politicianId, politicians.id))
        .orderBy(desc(assetDeclarations.declarationYear)),
    ]);

    return {
      politicians: allPoliticians,
      parties: allParties,
      sources: allSources,
      corrections: allCorrections,
      users: allUsers,
      elections: allElections,
      constituencies: allConstituencies,
      declarations: allDeclarations,
    };
  } catch (error) {
    throw dbError('Failed to load admin workspace.', error);
  }
}

export async function adminCreatePolitician(input: {
  fullName: string;
  honorific: string;
  photoUrl?: string | null;
  dateOfBirth?: string;
  birthPlace: string;
  province: string;
  education: string;
  biography: string;
  currentPartyId?: number | null;
  currentPositionTitle: string;
  currentConstituencyCode: string;
  businessInterestsSummary: string;
  verificationStatus: string;
  isFeatured?: boolean;
  isDemoData?: boolean;
  isPublished?: boolean;
}) {
  try {
    const baseSlug = slugifyText(input.fullName) || `politician-${Date.now()}`;
    const existing = await db
      .select({ id: politicians.id })
      .from(politicians)
      .where(eq(politicians.slug, baseSlug))
      .limit(1);

    const slug = existing.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const inserted = await db
      .insert(politicians)
      .values({
        slug,
        fullName: input.fullName.trim(),
        honorific: input.honorific.trim(),
        photoUrl: input.photoUrl?.trim() || null,
        dateOfBirth: input.dateOfBirth?.trim() || 'Unavailable',
        birthPlace: input.birthPlace.trim(),
        province: input.province.trim(),
        education: input.education.trim(),
        biography: input.biography.trim(),
        currentPartyId: input.currentPartyId ?? null,
        currentPositionTitle: input.currentPositionTitle.trim(),
        currentConstituencyCode: input.currentConstituencyCode.trim(),
        businessInterestsSummary: input.businessInterestsSummary.trim(),
        verificationStatus: input.verificationStatus,
        isFeatured: Boolean(input.isFeatured),
        isDemoData: input.isDemoData ?? false,
        isPublished: input.isPublished ?? true,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    throw dbError('Failed to create politician record.', error);
  }
}

export async function adminUpdatePolitician(
  id: number,
  input: Partial<{
    fullName: string;
    honorific: string;
    photoUrl: string | null;
    dateOfBirth: string;
    birthPlace: string;
    province: string;
    education: string;
    biography: string;
    currentPartyId: number | null;
    currentPositionTitle: string;
    currentConstituencyCode: string;
    businessInterestsSummary: string;
    verificationStatus: string;
    isFeatured: boolean;
    isPublished: boolean;
  }>,
) {
  try {
    const updated = await db
      .update(politicians)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(politicians.id, id))
      .returning();

    return updated[0] ?? null;
  } catch (error) {
    throw dbError('Failed to update politician record.', error);
  }
}

export async function adminCreateParty(input: {
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
  verificationStatus: string;
  isDemoData?: boolean;
}) {
  try {
    const baseSlug = slugifyText(input.name) || `party-${Date.now()}`;
    const inserted = await db
      .insert(politicalParties)
      .values({
        slug: baseSlug,
        name: input.name.trim(),
        abbreviation: input.abbreviation.trim().toUpperCase(),
        foundedYear: input.foundedYear,
        foundingLeadership: input.foundingLeadership.trim(),
        currentLeadership: input.currentLeadership.trim(),
        headquarters: input.headquarters.trim(),
        ideologySummary: input.ideologySummary.trim(),
        politicalHistory: input.politicalHistory.trim(),
        parliamentarySeatsSummary: input.parliamentarySeatsSummary.trim(),
        affiliationsHistory: input.affiliationsHistory.trim(),
        logoInitials: input.abbreviation.trim().toUpperCase().slice(0, 5),
        verificationStatus: input.verificationStatus,
        isDemoData: input.isDemoData ?? false,
        isPublished: true,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    throw dbError('Failed to create political party.', error);
  }
}

export async function adminCreateElectionResult(input: {
  electionId: number;
  constituencyId: number;
  politicianId?: number | null;
  candidateName: string;
  partyId?: number | null;
  partyAbbreviation: string;
  votesReceived: number;
  totalValidVotes?: number | null;
  isWinner: boolean;
  winningCandidateName: string;
  resultStatus: string;
  verificationStatus: string;
  sourceId?: number | null;
}) {
  try {
    const inserted = await db
      .insert(electionResults)
      .values({
        ...input,
        positionRank: input.isWinner ? 1 : 2,
        isDemoData: false,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    throw dbError('Failed to add election result.', error);
  }
}

export async function adminCreateAssetDeclaration(input: {
  politicianId: number;
  declarationYear: number;
  fiscalYearLabel: string;
  currency: string;
  totalDeclaredAssets: string;
  totalDeclaredLiabilities: string;
  netDeclaredSummary: string;
  filingAuthority: string;
  verificationStatus: string;
  sourceId?: number | null;
}) {
  try {
    const inserted = await db
      .insert(assetDeclarations)
      .values({
        ...input,
        isDemoData: false,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    throw dbError('Failed to add asset declaration.', error);
  }
}

export async function adminCreateSource(input: {
  title: string;
  url: string;
  publisher: string;
  publicationDate: string;
  verificationStatus: string;
  notes?: string;
}) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const inserted = await db
      .insert(sources)
      .values({
        title: input.title.trim(),
        url: input.url.trim(),
        publisher: input.publisher.trim(),
        publicationDate: input.publicationDate.trim(),
        dateCollected: today,
        lastUpdatedAt: today,
        verificationStatus: input.verificationStatus,
        notes: input.notes?.trim() || null,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    throw dbError('Failed to create reference source.', error);
  }
}

export async function adminReviewCorrection(
  id: number,
  input: {
    status: 'approved' | 'rejected' | 'resolved' | 'pending';
    adminNotes: string;
    reviewedByUid: string;
  },
) {
  try {
    const updated = await db
      .update(correctionRequests)
      .set({
        status: input.status,
        adminNotes: input.adminNotes.trim(),
        reviewedByUid: input.reviewedByUid,
        updatedAt: new Date(),
      })
      .where(eq(correctionRequests.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    throw dbError('Failed to update correction request.', error);
  }
}

export async function adminUpdateUserRole(id: number, role: string) {
  try {
    const updated = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    throw dbError('Failed to update user role.', error);
  }
}

export async function adminRecordVerification(input: {
  entityType: string;
  entityId: number;
  fieldOrSection: string;
  claimSummary: string;
  status: string;
  sourceId?: number | null;
  reviewedByUid: string;
  reviewedByEmail: string;
  reviewerNotes?: string;
}) {
  try {
    const inserted = await db
      .insert(verificationRecords)
      .values({
        ...input,
      })
      .returning();

    if (input.entityType === 'politician') {
      await db
        .update(politicians)
        .set({ verificationStatus: input.status, updatedAt: new Date() })
        .where(eq(politicians.id, input.entityId));
    } else if (input.entityType === 'party') {
      await db
        .update(politicalParties)
        .set({ verificationStatus: input.status, updatedAt: new Date() })
        .where(eq(politicalParties.id, input.entityId));
    }

    return inserted[0];
  } catch (error) {
    throw dbError('Failed to log verification status.', error);
  }
}
