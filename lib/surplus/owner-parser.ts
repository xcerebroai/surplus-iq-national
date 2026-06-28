/**
 * Owner name parser.
 *
 * Splits a raw owner string from a public list into business_name, first_name,
 * last_name, and owner_type. SPEC rule: ALWAYS preserve owner_raw_name; never
 * delete the original source value — so the input is returned verbatim in the
 * result.
 *
 * Entity detection: if any token is an entity keyword (LLC, INC, CORP, LP, LLP,
 * TRUST, ESTATE, BANK, ASSOCIATION, COMPANY, CO, HOLDINGS, PROPERTIES,
 * INVESTMENTS, plus a few common spellings), the record is an entity — TRUST ->
 * trust, ESTATE -> estate, otherwise business.
 *
 * Individual name order: public county/clerk lists are overwhelmingly
 * "LASTNAME FIRSTNAME [MIDDLE]" or "LASTNAME, FIRSTNAME". This parser assumes
 * that convention:
 *   - "SMITH, JOHN A"  -> last "Smith", first "John"
 *   - "WHITFIELD JAMES R" -> last "Whitfield", first "James"
 * If a source is known to publish "First Last" order, it should be normalized
 * upstream before parsing. (Reported as an assumption.)
 */

import { OwnerType } from "../../types/enums";

export interface OwnerParseResult {
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
  owner_type: OwnerType;
  /** The original input, always preserved unchanged. */
  owner_raw_name: string | null;
}

/** Keywords that mark a trust. */
const TRUST_KEYWORDS = new Set(["TRUST"]);
/** Keywords that mark an estate. */
const ESTATE_KEYWORDS = new Set(["ESTATE"]);
/** Keywords (and common spellings) that mark a generic business entity. */
const BUSINESS_KEYWORDS = new Set([
  "LLC",
  "INC",
  "INCORPORATED",
  "CORP",
  "CORPORATION",
  "LP",
  "LLP",
  "BANK",
  "ASSOCIATION",
  "ASSN",
  "COMPANY",
  "CO",
  "HOLDINGS",
  "PROPERTIES",
  "INVESTMENTS",
]);

/** Tokens that mean "no identifiable owner". */
const PLACEHOLDER_TOKENS = new Set([
  "UNKNOWN",
  "OCCUPANT",
  "NA",
  "N/A",
  "NONE",
  "TBD",
  "UNKNOWNOWNER",
]);

/** Entity suffixes kept fully uppercase when title-casing a business name. */
const KEEP_UPPER = new Set(["LLC", "LP", "LLP"]);
/** Small words lowercased when title-casing (unless first token). */
const SMALL_WORDS = new Set(["OF", "THE", "AND", "FOR"]);

/** Strip surrounding punctuation from a token (keeps internal letters). */
function cleanToken(token: string): string {
  return token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
}

/** Split a raw name into cleaned, non-empty tokens (splits on space and slash). */
function tokenize(raw: string): string[] {
  return raw
    .split(/[\s/]+/)
    .map(cleanToken)
    .filter((t) => t.length > 0);
}

function titleCaseWord(word: string, isFirst: boolean): string {
  const upper = word.toUpperCase();
  if (KEEP_UPPER.has(upper)) return upper;
  if (!isFirst && SMALL_WORDS.has(upper)) return word.toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Title-case a multi-word name, keeping entity acronyms uppercase. */
function titleCaseName(raw: string): string {
  return tokenize(raw)
    .map((w, i) => titleCaseWord(w, i === 0))
    .join(" ");
}

function detectEntityType(upperTokens: string[]): OwnerType | null {
  if (upperTokens.some((t) => TRUST_KEYWORDS.has(t))) return OwnerType.Trust;
  if (upperTokens.some((t) => ESTATE_KEYWORDS.has(t))) return OwnerType.Estate;
  if (upperTokens.some((t) => BUSINESS_KEYWORDS.has(t))) return OwnerType.Business;
  return null;
}

export function parseOwnerName(ownerRawName: string | null): OwnerParseResult {
  const owner_raw_name = ownerRawName; // preserved verbatim, always

  const base: OwnerParseResult = {
    business_name: null,
    first_name: null,
    last_name: null,
    owner_type: OwnerType.Unknown,
    owner_raw_name,
  };

  if (ownerRawName == null) return base;
  const raw = ownerRawName.trim();
  if (raw.length === 0) return base;

  const tokens = tokenize(raw);
  const upperTokens = tokens.map((t) => t.toUpperCase());

  // Placeholder / no identifiable owner.
  if (tokens.length === 0 || upperTokens.every((t) => PLACEHOLDER_TOKENS.has(t))) {
    return base;
  }
  if (upperTokens.some((t) => PLACEHOLDER_TOKENS.has(t))) {
    // Mixed with a placeholder (e.g. "OCCUPANT / UNKNOWN") -> treat as unknown.
    if (upperTokens.some((t) => t === "UNKNOWN" || t === "OCCUPANT")) {
      return base;
    }
  }

  // Entity?
  const entityType = detectEntityType(upperTokens);
  if (entityType) {
    return {
      ...base,
      owner_type: entityType,
      business_name: titleCaseName(raw),
    };
  }

  // Individual. Convention: "Last, First" or "Last First [Middle]".
  const commaIndex = raw.indexOf(",");
  if (commaIndex !== -1) {
    const lastPart = raw.slice(0, commaIndex);
    const restTokens = tokenize(raw.slice(commaIndex + 1));
    return {
      ...base,
      owner_type: OwnerType.Individual,
      last_name: titleCaseName(lastPart) || null,
      first_name: restTokens.length > 0 ? titleCaseWord(restTokens[0], true) : null,
    };
  }

  if (tokens.length === 1) {
    // Single token — treat as a surname/mononym.
    return {
      ...base,
      owner_type: OwnerType.Individual,
      last_name: titleCaseWord(tokens[0], true),
    };
  }

  // Two or more tokens, no comma: "LAST FIRST [MIDDLE...]".
  return {
    ...base,
    owner_type: OwnerType.Individual,
    last_name: titleCaseWord(tokens[0], true),
    first_name: titleCaseWord(tokens[1], true),
  };
}
