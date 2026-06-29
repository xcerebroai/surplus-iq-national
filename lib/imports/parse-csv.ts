/**
 * Build-time table readers for public lists. Used only by the ingestion path
 * (scripts/build-data.ts) — never shipped to the browser.
 *
 * `parseCsv` is a small RFC-4180-style parser (quoted fields, escaped quotes,
 * embedded commas/newlines, CRLF or LF). `readTable` dispatches on file
 * extension to read CSV or XLSX into a uniform header + row-object shape.
 */

import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { createRequire } from "node:module";

// ESM-safe require for the build-time-only xlsx dependency.
const require = createRequire(import.meta.url);

/** Parse CSV text into a matrix of string cells. */
export function parseCsv(input: string): string[][] {
  let text = input;
  // Strip a UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  // Flush the final field/row if the file doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** True when every cell in a row is blank/whitespace. */
function isEmptyRow(cells: string[]): boolean {
  return cells.every((c) => c.trim() === "");
}

export interface Table {
  headers: string[];
  /** One object per data row, keyed by (trimmed) header. */
  rows: Record<string, string>[];
}

/** Turn a cell matrix into header + row objects, dropping fully-empty rows. */
export function matrixToTable(matrix: string[][]): Table {
  const nonEmpty = matrix.filter((r) => !isEmptyRow(r));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((h) => h.trim());
  const rows = nonEmpty.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (cells[idx] ?? "").toString();
    });
    return obj;
  });
  return { headers, rows };
}

/** Read an .xlsx file's first sheet into a cell matrix (values as strings). */
function readXlsxMatrix(path: string): string[][] {
  const XLSX = require("xlsx") as typeof import("xlsx");
  const wb = XLSX.readFile(path, { cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false, // format values as display strings (dates/numbers -> text)
    defval: "",
    blankrows: false,
  });
}

/** Read a CSV or XLSX file into a uniform Table. Throws on unsupported types. */
export function readTable(path: string): Table {
  const ext = extname(path).toLowerCase();
  if (ext === ".csv") {
    return matrixToTable(parseCsv(readFileSync(path, "utf8")));
  }
  if (ext === ".xlsx" || ext === ".xls") {
    return matrixToTable(readXlsxMatrix(path));
  }
  throw new Error(`Unsupported list file type: ${ext} (${path})`);
}
