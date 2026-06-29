import { test } from "node:test";
import assert from "node:assert/strict";

import { parseCsv, matrixToTable } from "./parse-csv";

test("parses simple rows", () => {
  assert.deepEqual(parseCsv("a,b,c\n1,2,3"), [
    ["a", "b", "c"],
    ["1", "2", "3"],
  ]);
});

test("handles quoted fields with commas and escaped quotes", () => {
  const csv = 'name,note\n"Acme, LLC","he said ""hi"""';
  assert.deepEqual(parseCsv(csv), [
    ["name", "note"],
    ["Acme, LLC", 'he said "hi"'],
  ]);
});

test("handles embedded newlines inside quotes", () => {
  const csv = 'a,b\n"line1\nline2",x';
  assert.deepEqual(parseCsv(csv), [
    ["a", "b"],
    ["line1\nline2", "x"],
  ]);
});

test("handles CRLF and trailing newline and BOM", () => {
  const csv = "﻿a,b\r\n1,2\r\n";
  assert.deepEqual(parseCsv(csv), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("matrixToTable trims headers and drops empty rows", () => {
  const table = matrixToTable([
    [" Owner Name ", "City"],
    ["SMITH JOHN", "Tampa"],
    ["", ""],
    ["DOE JANE", "Miami"],
  ]);
  assert.deepEqual(table.headers, ["Owner Name", "City"]);
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[0]["Owner Name"], "SMITH JOHN");
  assert.equal(table.rows[1]["City"], "Miami");
});

test("matrixToTable handles short rows (missing trailing cells)", () => {
  const table = matrixToTable([
    ["a", "b", "c"],
    ["1", "2"],
  ]);
  assert.equal(table.rows[0]["a"], "1");
  assert.equal(table.rows[0]["b"], "2");
  assert.equal(table.rows[0]["c"], "");
});
