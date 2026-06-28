import { test } from "node:test";
import assert from "node:assert/strict";

import { parseOwnerName } from "./owner-parser";
import { OwnerType } from "../../types/enums";

// Every entity keyword from SPEC maps to a business owner_type.
const BUSINESS_KEYWORD_NAMES: Array<[string, string]> = [
  ["LLC", "SUNRISE HOLDINGS LLC"],
  ["INC", "BUCKEYE ASSET GROUP INC"],
  ["CORP", "CASCADE REALTY CORP"],
  ["LP", "EVERGREEN PROPERTY PARTNERS LP"],
  ["LLP", "SMITH & JONES LLP"],
  ["BANK", "FIRST NATIONAL BANK"],
  ["ASSOCIATION", "OAKWOOD HOMEOWNERS ASSOCIATION"],
  ["COMPANY", "ACME LAND COMPANY"],
  ["CO", "RIVERSIDE CO"],
  ["HOLDINGS", "PEACHTREE HOLDINGS"],
  ["PROPERTIES", "BLUE SKY PROPERTIES"],
  ["INVESTMENTS", "LONE STAR INVESTMENTS"],
];

for (const [keyword, name] of BUSINESS_KEYWORD_NAMES) {
  test(`entity keyword ${keyword} -> business`, () => {
    const r = parseOwnerName(name);
    assert.equal(r.owner_type, OwnerType.Business, `${name} should be business`);
    assert.ok(r.business_name, "business_name should be set");
    assert.equal(r.first_name, null);
    assert.equal(r.last_name, null);
    assert.equal(r.owner_raw_name, name);
  });
}

test("TRUST keyword -> trust", () => {
  const r = parseOwnerName("JOHNSON FAMILY TRUST");
  assert.equal(r.owner_type, OwnerType.Trust);
  assert.equal(r.business_name, "Johnson Family Trust");
  assert.equal(r.owner_raw_name, "JOHNSON FAMILY TRUST");
});

test("ESTATE keyword -> estate (and small words lowercased)", () => {
  const r = parseOwnerName("ESTATE OF ROBERT KING");
  assert.equal(r.owner_type, OwnerType.Estate);
  assert.equal(r.business_name, "Estate of Robert King");
});

test("clean individual, no comma -> Last First convention", () => {
  const r = parseOwnerName("WHITFIELD JAMES R");
  assert.equal(r.owner_type, OwnerType.Individual);
  assert.equal(r.last_name, "Whitfield");
  assert.equal(r.first_name, "James");
  assert.equal(r.business_name, null);
  assert.equal(r.owner_raw_name, "WHITFIELD JAMES R");
});

test("individual with comma -> Last, First", () => {
  const r = parseOwnerName("SMITH, JOHN A");
  assert.equal(r.owner_type, OwnerType.Individual);
  assert.equal(r.last_name, "Smith");
  assert.equal(r.first_name, "John");
});

test("two-token individual -> Last First", () => {
  const r = parseOwnerName("GONZALEZ MARIA");
  assert.equal(r.last_name, "Gonzalez");
  assert.equal(r.first_name, "Maria");
});

test("placeholder owner -> unknown, names null, raw preserved", () => {
  const r = parseOwnerName("OCCUPANT / UNKNOWN");
  assert.equal(r.owner_type, OwnerType.Unknown);
  assert.equal(r.business_name, null);
  assert.equal(r.first_name, null);
  assert.equal(r.last_name, null);
  assert.equal(r.owner_raw_name, "OCCUPANT / UNKNOWN");
});

test("null input -> unknown, raw preserved as null", () => {
  const r = parseOwnerName(null);
  assert.equal(r.owner_type, OwnerType.Unknown);
  assert.equal(r.owner_raw_name, null);
});

test("owner_raw_name is always preserved verbatim", () => {
  const raw = "  van Buren, Martin   ";
  const r = parseOwnerName(raw);
  assert.equal(r.owner_raw_name, raw, "raw must never be trimmed or mutated");
});
