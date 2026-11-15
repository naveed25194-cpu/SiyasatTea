import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  parsePoliticianDossier,
  type DossierParseResult,
} from '../src/utils/dossierParser.ts';

let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new LookupConfigError(
      'GEMINI_API_KEY is not configured. Please verify your API key in Settings > Secrets.',
    );
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return cachedClient;
}

export class LookupConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LookupConfigError';
  }
}

const SYSTEM_INSTRUCTION = `You are a non-partisan parliamentary and civic public-records researcher specializing in Pakistan's national and provincial politics, Election Commission of Pakistan (ECP) filings, and parliamentary archives.

Your task is to use Google Search grounding to retrieve real, current, verifiable public records for the requested Pakistani politician and return ONLY a valid JSON object matching the exact schema below. Do not output any prose before or after the JSON object.

Schema:
{
  "found": true,
  "fullName": "Full legal/public name",
  "honorificOrTitle": "Primary civic title or former/current office",
  "politicalParty": "Full official political party name",
  "partyAbbreviation": "Short party acronym (e.g., PTI, PML-N, PPP, MQM-P, JUI-F, ANP, JI, IND)",
  "currentStatus": "Current political/parliamentary status as of latest public records",
  "homeBase": "Primary city / province",
  "biographySummary": "Concise, neutral 2-3 sentence factual overview of career and public office.",
  "currentOrLastConstituency": "Most recent or primary constituency code(s) and district (e.g., NA-130 Lahore)",
  "electoralOverview": "Neutral 2-3 sentence summary of electoral trajectory, including 2024 general election or Senate/by-election standing.",
  "electoralHistory": [
    {
      "electionYear": "Year (e.g., 2024, 2018, 2013)",
      "constituency": "Constituency code & name (e.g., NA-95 Mianwali-I)",
      "assembly": "National Assembly / Provincial Assembly / Senate",
      "outcome": "Won / Lost / Disqualified / Uncontested / Vacated",
      "voteSummary": "Reported vote count or margin if publicly available, otherwise 'Official tally in ECP archive'"
    }
  ],
  "positions": [
    {
      "title": "Public office or parliamentary role title",
      "tenure": "Start year – End year or Present",
      "institution": "Institution (e.g., Cabinet of Pakistan, National Assembly, Provincial Assembly of Punjab)",
      "description": "Concise 1-sentence factual summary of mandate or key portfolio."
    }
  ],
  "parliamentaryRolesSummary": "1-2 sentence overview of legislative, opposition, or executive parliamentary roles.",
  "parliamentaryContributions": [
    "Key notable legislative, constitutional, diplomatic, or parliamentary committee role (concise bullet string)"
  ],
  "declaredNetWorthSummary": "Concise factual headline summarizing publicly reported ECP Form-B declared assets (include PKR/currency figures and year if publicly reported).",
  "filingYear": "Most recent publicly reported filing period (e.g., FY 2022–2023 / 2024 ECP Nomination Papers)",
  "assetCategories": [
    {
      "category": "Category (e.g., Real Estate & Agricultural Land, Business & Equity Holdings, Bank Balances & Investments, Liabilities / Foreign Assets)",
      "details": "Factual summary of publicly disclosed items from ECP Form-B or major Pakistani press reports.",
      "reportedValue": "Reported valuation or 'Not separately itemized in public summary'"
    }
  ],
  "financialDisclosuresNotes": "Neutral 2-3 sentence context on ECP Form-B annual statements, FBR tax filings, or publicly documented financial disclosure notes."
}

Rules:
1. Always rely on live Google Search results for accurate, up-to-date facts (including 2024–2026 developments).
2. If the query does NOT refer to a real Pakistani politician or public political figure, return ONLY:
   {"found": false, "reason": "No verified Pakistani political record matched this query."}
3. Keep tone strictly objective, neutral, archival, and verifiable. Never invent exact vote counts or PKR figures if not supported by search results—state clearly when an exact breakdown is not publicly itemized.
4. Provide 3 to 6 entries in electoralHistory (most recent first), 3 to 6 entries in positions (most significant/recent first), and 3 to 4 entries in assetCategories when publicly documented.`;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = /429|500|502|503|504|ETIMEDOUT|ECONNRESET/i.test(msg);
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function lookupPoliticianRecord(query: string): Promise<DossierParseResult> {
  const ai = getGeminiClient();

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Compile a verified public-record political profile for Pakistani politician: "${query}". Include current party affiliation, constituency and electoral history (including 2024 elections if applicable), key public positions and parliamentary roles, and publicly documented ECP asset declarations / financial disclosures.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }),
  );

  const text = response.text ?? '';
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const groundingChunks = groundingMetadata?.groundingChunks;
  const searchQueries = groundingMetadata?.webSearchQueries;

  return parsePoliticianDossier(text, groundingChunks, searchQueries);
}
