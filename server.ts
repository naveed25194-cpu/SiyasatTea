import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LookupConfigError,
  lookupPoliticianRecord,
} from './server/politicianLookup.ts';
import {
  adminCreateAssetDeclaration,
  adminCreateElectionResult,
  adminCreateParty,
  adminCreatePolitician,
  adminCreateSource,
  adminRecordVerification,
  adminReviewCorrection,
  adminUpdatePolitician,
  adminUpdateUserRole,
  createCorrectionRequest,
  getAdminWorkspaceData,
  getElectionRecords,
  getFinancialTransparencyRecords,
  getParliamentaryRecordsList,
  getPartiesDirectory,
  getPartyDetailBySlug,
  getPlatformOverview,
  getPoliticianDetailBySlug,
  getPoliticiansDirectory,
  getSourcesAndVerifications,
} from './src/db/queries.ts';
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from './src/middleware/auth.ts';
import { validateSearchQuery } from './src/utils/dossierParser.ts';
import { validateCorrectionInput } from './src/utils/platformLogic.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public transparency platform endpoints
  app.get('/api/overview', async (_req, res) => {
    try {
      const overview = await getPlatformOverview();
      res.json(overview);
    } catch (err) {
      console.error('Overview error:', err);
      res.status(500).json({ error: 'Unable to load platform overview.' });
    }
  });

  app.get('/api/politicians', async (_req, res) => {
    try {
      const list = await getPoliticiansDirectory(false);
      res.json(list);
    } catch (err) {
      console.error('Politicians directory error:', err);
      res.status(500).json({ error: 'Unable to load politicians directory.' });
    }
  });

  app.get('/api/politicians/:slug', async (req, res) => {
    try {
      const detail = await getPoliticianDetailBySlug(req.params.slug);
      if (!detail) {
        res.status(404).json({ error: 'Politician profile not found.' });
        return;
      }
      res.json(detail);
    } catch (err) {
      console.error('Politician detail error:', err);
      res.status(500).json({ error: 'Unable to load politician profile.' });
    }
  });

  app.get('/api/parties', async (_req, res) => {
    try {
      const partiesList = await getPartiesDirectory();
      res.json(partiesList);
    } catch (err) {
      console.error('Parties directory error:', err);
      res.status(500).json({ error: 'Unable to load political parties directory.' });
    }
  });

  app.get('/api/parties/:slug', async (req, res) => {
    try {
      const detail = await getPartyDetailBySlug(req.params.slug);
      if (!detail) {
        res.status(404).json({ error: 'Political party not found.' });
        return;
      }
      res.json(detail);
    } catch (err) {
      console.error('Party detail error:', err);
      res.status(500).json({ error: 'Unable to load party profile.' });
    }
  });

  app.get('/api/elections', async (_req, res) => {
    try {
      const records = await getElectionRecords();
      res.json(records);
    } catch (err) {
      console.error('Elections error:', err);
      res.status(500).json({ error: 'Unable to load election records.' });
    }
  });

  app.get('/api/financials', async (_req, res) => {
    try {
      const records = await getFinancialTransparencyRecords();
      res.json(records);
    } catch (err) {
      console.error('Financials error:', err);
      res.status(500).json({ error: 'Unable to load financial disclosures.' });
    }
  });

  app.get('/api/parliament', async (_req, res) => {
    try {
      const records = await getParliamentaryRecordsList();
      res.json(records);
    } catch (err) {
      console.error('Parliamentary records error:', err);
      res.status(500).json({ error: 'Unable to load parliamentary performance records.' });
    }
  });

  app.get('/api/sources', async (_req, res) => {
    try {
      const data = await getSourcesAndVerifications();
      res.json(data);
    } catch (err) {
      console.error('Sources error:', err);
      res.status(500).json({ error: 'Unable to load sources and verification logs.' });
    }
  });

  app.post('/api/corrections', async (req, res) => {
    const check = validateCorrectionInput(req.body ?? {});
    if (!check.valid) {
      res.status(400).json({ error: check.error });
      return;
    }

    try {
      const created = await createCorrectionRequest({
        entityType: req.body.entityType,
        entityId: Number(req.body.entityId),
        entityLabel: req.body.entityLabel ?? 'Public Record',
        sectionName: req.body.sectionName,
        submittedClaim: req.body.submittedClaim,
        suggestedCorrection: req.body.suggestedCorrection,
        evidenceUrl: req.body.evidenceUrl,
        submitterName: req.body.submitterName,
        submitterEmail: req.body.submitterEmail,
      });
      res.status(201).json(created);
    } catch (err) {
      console.error('Correction submission error:', err);
      res.status(500).json({ error: 'Failed to submit correction report.' });
    }
  });

  // Live Gemini Search Grounding Public Lookup
  app.post('/api/politician', async (req, res) => {
    const validation = validateSearchQuery(req.body?.query);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const result = await lookupPoliticianRecord(validation.normalized);
      if (!result.ok) {
        res.status(result.notFound ? 404 : 502).json({
          error: result.error,
          code: result.notFound ? 'NOT_FOUND' : 'PARSE_ERROR',
        });
        return;
      }

      res.json(result.dossier);
    } catch (err) {
      if (err instanceof LookupConfigError) {
        res.status(503).json({ error: err.message, code: 'CONFIG_ERROR' });
        return;
      }

      const rawMessage = err instanceof Error ? err.message : String(err);
      console.error('Politician lookup failed:', rawMessage);

      if (/PERMISSION_DENIED|API_KEY_INVALID|403|401/i.test(rawMessage)) {
        res.status(502).json({
          error:
            'Unable to authenticate with the Gemini API. Please check the API key in Settings > Secrets.',
          code: 'AUTH_ERROR',
        });
        return;
      }

      if (/RESOURCE_EXHAUSTED|429/i.test(rawMessage)) {
        res.status(429).json({
          error:
            'Search grounding quota was temporarily exceeded (429 RESOURCE_EXHAUSTED). Please wait a moment and try again, or select a billing-enabled API key in Settings > Secrets.',
          code: 'RATE_LIMIT',
        });
        return;
      }

      res.status(500).json({
        error:
          'Unable to retrieve grounded public records at this moment. Please try again.',
        code: 'LOOKUP_FAILED',
      });
    }
  });

  // Authenticated & Role-Based Admin Routes
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      user: req.dbUser,
    });
  });

  app.get(
    '/api/admin/workspace',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (_req: AuthRequest, res) => {
      try {
        const data = await getAdminWorkspaceData();
        res.json(data);
      } catch (err) {
        console.error('Admin workspace error:', err);
        res.status(500).json({ error: 'Unable to load admin workspace.' });
      }
    },
  );

  app.post(
    '/api/admin/politicians',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const b = req.body ?? {};
      if (!b.fullName || !b.province || !b.currentPositionTitle) {
        res.status(400).json({
          error: 'Full name, province, and current position title are required.',
        });
        return;
      }
      try {
        const created = await adminCreatePolitician({
          fullName: String(b.fullName),
          honorific: String(b.honorific || 'Public Representative'),
          photoUrl: b.photoUrl ? String(b.photoUrl) : null,
          dateOfBirth: b.dateOfBirth ? String(b.dateOfBirth) : 'Unavailable',
          birthPlace: String(b.birthPlace || b.province),
          province: String(b.province),
          education: String(b.education || 'Unavailable'),
          biography: String(b.biography || 'Public record entry added by editorial team.'),
          currentPartyId: b.currentPartyId ? Number(b.currentPartyId) : null,
          currentPositionTitle: String(b.currentPositionTitle),
          currentConstituencyCode: String(b.currentConstituencyCode || 'Unavailable'),
          businessInterestsSummary: String(
            b.businessInterestsSummary || 'No commercial directorships documented.',
          ),
          verificationStatus: String(
            b.verificationStatus || 'Reported, not independently verified',
          ),
          isFeatured: Boolean(b.isFeatured),
          isDemoData: Boolean(b.isDemoData),
          isPublished: b.isPublished !== false,
        });
        res.status(201).json(created);
      } catch (err) {
        console.error('Create politician error:', err);
        res.status(500).json({ error: 'Failed to create politician profile.' });
      }
    },
  );

  app.patch(
    '/api/admin/politicians/:id',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid politician ID.' });
        return;
      }
      try {
        const updated = await adminUpdatePolitician(id, req.body ?? {});
        if (!updated) {
          res.status(404).json({ error: 'Politician not found.' });
          return;
        }
        res.json(updated);
      } catch (err) {
        console.error('Update politician error:', err);
        res.status(500).json({ error: 'Failed to update politician profile.' });
      }
    },
  );

  app.post(
    '/api/admin/parties',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const b = req.body ?? {};
      if (!b.name || !b.abbreviation || !b.foundedYear) {
        res.status(400).json({
          error: 'Party name, abbreviation, and founding year are required.',
        });
        return;
      }
      try {
        const created = await adminCreateParty({
          name: String(b.name),
          abbreviation: String(b.abbreviation),
          foundedYear: Number(b.foundedYear),
          foundingLeadership: String(b.foundingLeadership || 'Unavailable'),
          currentLeadership: String(b.currentLeadership || 'Unavailable'),
          headquarters: String(b.headquarters || 'Pakistan'),
          ideologySummary: String(b.ideologySummary || 'Constitutional parliamentary party.'),
          politicalHistory: String(b.politicalHistory || 'Added to PakPolitico directory.'),
          parliamentarySeatsSummary: String(
            b.parliamentarySeatsSummary || 'Parliamentary representation pending verification.',
          ),
          affiliationsHistory: String(b.affiliationsHistory || 'Unavailable'),
          verificationStatus: String(
            b.verificationStatus || 'Reported, not independently verified',
          ),
          isDemoData: Boolean(b.isDemoData),
        });
        res.status(201).json(created);
      } catch (err) {
        console.error('Create party error:', err);
        res.status(500).json({ error: 'Failed to create political party.' });
      }
    },
  );

  app.post(
    '/api/admin/election-results',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const b = req.body ?? {};
      if (!b.electionId || !b.constituencyId || !b.candidateName || !b.partyAbbreviation) {
        res.status(400).json({
          error: 'Election, constituency, candidate name, and party are required.',
        });
        return;
      }
      try {
        const created = await adminCreateElectionResult({
          electionId: Number(b.electionId),
          constituencyId: Number(b.constituencyId),
          politicianId: b.politicianId ? Number(b.politicianId) : null,
          candidateName: String(b.candidateName),
          partyId: b.partyId ? Number(b.partyId) : null,
          partyAbbreviation: String(b.partyAbbreviation),
          votesReceived: Number(b.votesReceived || 0),
          totalValidVotes: b.totalValidVotes ? Number(b.totalValidVotes) : null,
          isWinner: Boolean(b.isWinner),
          winningCandidateName: String(b.winningCandidateName || b.candidateName),
          resultStatus: String(b.resultStatus || (b.isWinner ? 'Won' : 'Runner-up')),
          verificationStatus: String(
            b.verificationStatus || 'Officially documented',
          ),
          sourceId: b.sourceId ? Number(b.sourceId) : null,
        });
        res.status(201).json(created);
      } catch (err) {
        console.error('Create election result error:', err);
        res.status(500).json({ error: 'Failed to add election result.' });
      }
    },
  );

  app.post(
    '/api/admin/asset-declarations',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const b = req.body ?? {};
      if (!b.politicianId || !b.declarationYear || !b.totalDeclaredAssets) {
        res.status(400).json({
          error: 'Politician, declaration year, and declared assets total are required.',
        });
        return;
      }
      try {
        const created = await adminCreateAssetDeclaration({
          politicianId: Number(b.politicianId),
          declarationYear: Number(b.declarationYear),
          fiscalYearLabel: String(b.fiscalYearLabel || `FY ${b.declarationYear}`),
          currency: String(b.currency || 'PKR'),
          totalDeclaredAssets: String(b.totalDeclaredAssets),
          totalDeclaredLiabilities: String(b.totalDeclaredLiabilities || 'PKR 0'),
          netDeclaredSummary: String(
            b.netDeclaredSummary || 'Submitted via public asset disclosure record.',
          ),
          filingAuthority: String(
            b.filingAuthority || 'Election Commission of Pakistan (ECP)',
          ),
          verificationStatus: String(
            b.verificationStatus || 'Reported, not independently verified',
          ),
          sourceId: b.sourceId ? Number(b.sourceId) : null,
        });
        res.status(201).json(created);
      } catch (err) {
        console.error('Create asset declaration error:', err);
        res.status(500).json({ error: 'Failed to add asset declaration.' });
      }
    },
  );

  app.post(
    '/api/admin/sources',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const b = req.body ?? {};
      if (!b.title || !b.url || !b.publisher) {
        res.status(400).json({ error: 'Title, URL, and publisher are required.' });
        return;
      }
      try {
        const created = await adminCreateSource({
          title: String(b.title),
          url: String(b.url),
          publisher: String(b.publisher),
          publicationDate: String(
            b.publicationDate || new Date().toISOString().slice(0, 10),
          ),
          verificationStatus: String(b.verificationStatus || 'Officially documented'),
          notes: b.notes ? String(b.notes) : undefined,
        });
        res.status(201).json(created);
      } catch (err) {
        console.error('Create source error:', err);
        res.status(500).json({ error: 'Failed to create source citation.' });
      }
    },
  );

  app.post(
    '/api/admin/verifications',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const b = req.body ?? {};
      if (!b.entityType || !b.entityId || !b.status || !b.claimSummary) {
        res.status(400).json({ error: 'Missing required verification fields.' });
        return;
      }
      try {
        const record = await adminRecordVerification({
          entityType: String(b.entityType),
          entityId: Number(b.entityId),
          fieldOrSection: String(b.fieldOrSection || 'Overall Profile'),
          claimSummary: String(b.claimSummary),
          status: String(b.status),
          sourceId: b.sourceId ? Number(b.sourceId) : null,
          reviewedByUid: req.dbUser!.uid,
          reviewedByEmail: req.dbUser!.email,
          reviewerNotes: b.reviewerNotes ? String(b.reviewerNotes) : undefined,
        });
        res.status(201).json(record);
      } catch (err) {
        console.error('Verification record error:', err);
        res.status(500).json({ error: 'Failed to save verification log.' });
      }
    },
  );

  app.patch(
    '/api/admin/corrections/:id',
    requireAuth,
    requireRole(['admin', 'editor']),
    async (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid correction ID.' });
        return;
      }
      try {
        const updated = await adminReviewCorrection(id, {
          status: req.body?.status ?? 'resolved',
          adminNotes: String(req.body?.adminNotes ?? ''),
          reviewedByUid: req.dbUser!.uid,
        });
        if (!updated) {
          res.status(404).json({ error: 'Correction request not found.' });
          return;
        }
        res.json(updated);
      } catch (err) {
        console.error('Correction review error:', err);
        res.status(500).json({ error: 'Failed to update correction status.' });
      }
    },
  );

  app.patch(
    '/api/admin/users/:id/role',
    requireAuth,
    requireRole(['admin']),
    async (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      const role = String(req.body?.role ?? '');
      if (Number.isNaN(id) || !['admin', 'editor', 'researcher'].includes(role)) {
        res.status(400).json({ error: 'Valid user ID and role are required.' });
        return;
      }
      try {
        const updated = await adminUpdateUserRole(id, role);
        if (!updated) {
          res.status(404).json({ error: 'User not found.' });
          return;
        }
        res.json(updated);
      } catch (err) {
        console.error('User role update error:', err);
        res.status(500).json({ error: 'Failed to update user role.' });
      }
    },
  );

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PakPolitico server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
