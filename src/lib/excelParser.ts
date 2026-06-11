import * as XLSX from "xlsx";
import type { Document, Distribution } from "@/types";
import { genId } from "./utils";

const SHEET_DOCS = "MASTER LIST WI";
const SHEET_DIST = "ASM1 MASTER LIST PP-TH";
/** Header chiếm row 1–6, dữ liệu bắt đầu từ row 7 (index 6). */
const DATA_START_ROW = 6;

export interface ParsedExcel {
  documents: Omit<Document, "createdAt" | "updatedAt">[];
  distributions: Omit<Distribution, "createdAt">[];
  docSheetFound: boolean;
  distSheetFound: boolean;
}

/** Chuyển 1 ô Excel (number serial / Date / string) thành ISO date yyyy-MM-dd. */
function toISODate(cell: unknown): string {
  if (cell === null || cell === undefined || cell === "") return "";

  if (cell instanceof Date) {
    return isoFromDate(cell);
  }

  if (typeof cell === "number") {
    // Excel serial date → JS Date (epoch 1899-12-30).
    const parsed = XLSX.SSF.parse_date_code(cell);
    if (parsed) {
      const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return isoFromDate(d);
    }
    const d = new Date((cell - 25569) * 86400 * 1000);
    return isoFromDate(d);
  }

  const str = String(cell).trim();
  if (!str) return "";

  // dd/MM/yyyy hoặc dd-MM-yyyy
  const m = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    const year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? str : isoFromDate(d);
}

function isoFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cellStr(row: unknown[], idx: number): string {
  const v = row[idx];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellBool(row: unknown[], idx: number): boolean {
  const v = row[idx];
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  return ["true", "x", "yes", "có", "co", "1", "✓", "đã thu hồi"].includes(s);
}

/** Đọc 1 sheet thành mảng các hàng (array of arrays). */
function sheetRows(wb: XLSX.WorkBook, name: string): unknown[][] | null {
  const ws = wb.Sheets[name];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: true,
    blankrows: false,
  });
}

/** Parse workbook đã đọc thành documents + distributions. */
export function parseWorkbook(wb: XLSX.WorkBook): ParsedExcel {
  const result: ParsedExcel = {
    documents: [],
    distributions: [],
    docSheetFound: false,
    distSheetFound: false,
  };

  // --- Sheet 1: MASTER LIST WI ---
  const docRows = sheetRows(wb, SHEET_DOCS);
  if (docRows) {
    result.docSheetFound = true;
    for (let i = DATA_START_ROW; i < docRows.length; i++) {
      const row = docRows[i];
      const docCode = cellStr(row, 1); // B
      if (!docCode) continue;
      result.documents.push({
        id: genId(),
        docCode,
        docName: cellStr(row, 2), // C
        currentRev: cellStr(row, 3), // D
        docType: cellStr(row, 4), // E
        issueDate: toISODate(row[7]), // H
      });
    }
  }

  // --- Sheet 2: ASM1 MASTER LIST PP-TH ---
  const distRows = sheetRows(wb, SHEET_DIST);
  if (distRows) {
    result.distSheetFound = true;
    for (let i = DATA_START_ROW; i < distRows.length; i++) {
      const row = distRows[i];
      const docCode = cellStr(row, 1); // B
      const employeeId = cellStr(row, 8); // I
      if (!docCode || !employeeId) continue;
      result.distributions.push({
        id: genId(),
        docCode,
        docName: cellStr(row, 2), // C
        rev: cellStr(row, 3), // D
        docType: cellStr(row, 4) || "Bản gốc", // E
        detail: cellStr(row, 5), // F
        quantity: cellStr(row, 6) || "N/A", // G
        distributionDate: toISODate(row[7]), // H
        employeeId, // I
        dept: cellStr(row, 9), // J
        fullName: cellStr(row, 10), // K
        recalled: cellBool(row, 11), // L
        recalledDate: cellStr(row, 12) ? toISODate(row[12]) : null, // M
      });
    }
  }

  return result;
}

/** Đọc file Excel (.xlsx) và parse. */
export async function parseExcelFile(file: File): Promise<ParsedExcel> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: false });
  return parseWorkbook(wb);
}
