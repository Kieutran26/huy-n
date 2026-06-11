import type { Distribution } from "@/types";
import { compareDate, formatDate } from "./utils";

export interface RevValidation {
  valid: boolean;
  message?: string;
}

/** Lấy danh sách distributions của 1 docCode, sắp xếp theo ngày phân phát tăng dần. */
function distributionsOfDoc(
  distributions: Distribution[],
  docCode: string
): Distribution[] {
  return distributions
    .filter((d) => d.docCode === docCode)
    .sort((a, b) => compareDate(a.distributionDate, b.distributionDate));
}

/** Tập hợp các rev đã từng dùng (theo thứ tự phân phát). */
export function usedRevs(
  distributions: Distribution[],
  docCode: string
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const d of distributionsOfDoc(distributions, docCode)) {
    const r = (d.rev ?? "").trim();
    if (r && !seen.has(r.toUpperCase())) {
      seen.add(r.toUpperCase());
      result.push(r);
    }
  }
  return result;
}

/**
 * Rev hiện hành = Rev có distributionDate mới nhất (không phải giá trị lớn nhất).
 */
export function currentRevOf(
  distributions: Distribution[],
  docCode: string,
  fallback = ""
): string {
  const list = distributionsOfDoc(distributions, docCode);
  if (list.length === 0) return fallback;
  return list[list.length - 1].rev || fallback;
}

/**
 * Kiểm tra Rev mới có hợp lệ không (chưa từng được phân phát).
 */
export function validateRev(
  distributions: Distribution[],
  docCode: string,
  newRev: string
): RevValidation {
  const rev = (newRev ?? "").trim();
  if (!rev) {
    return { valid: false, message: "Vui lòng nhập Rev mới" };
  }
  const existing = distributionsOfDoc(distributions, docCode).find(
    (d) => d.rev.trim().toUpperCase() === rev.toUpperCase()
  );
  if (existing) {
    return {
      valid: false,
      message: `Rev ${rev} đã được phân phát ngày ${formatDate(
        existing.distributionDate
      )}`,
    };
  }
  return { valid: true };
}

/**
 * Gợi ý Rev tiếp theo dựa trên các rev đã dùng.
 * - Toàn số nguyên (00, 01, 02) → (max + 1) padStart(2, "0")
 * - Có chữ cái (A, A1, B2, AA) → tăng phần số cuối của rev mới nhất
 */
export function suggestNextRev(
  distributions: Distribution[],
  docCode: string
): string {
  const revs = usedRevs(distributions, docCode);
  if (revs.length === 0) return "00";

  const allNumeric = revs.every((r) => /^\d+$/.test(r));
  if (allNumeric) {
    const max = Math.max(...revs.map((r) => parseInt(r, 10)));
    return (max + 1).toString().padStart(2, "0");
  }

  // Rev mới nhất theo ngày phân phát là phần tử cuối của usedRevs.
  const latest = revs[revs.length - 1];
  return bumpAlphaNumericRev(latest);
}

/**
 * Tăng phần số cuối của rev dạng chữ-số.
 * A → A1, A1 → A2, B2 → B3, AA → AA1, 09 → 10 (nếu thuần số).
 */
export function bumpAlphaNumericRev(rev: string): string {
  const r = rev.trim();
  if (/^\d+$/.test(r)) {
    return (parseInt(r, 10) + 1).toString().padStart(r.length, "0");
  }
  const match = r.match(/^(.*?)(\d*)$/);
  if (!match) return r + "1";
  const alpha = match[1];
  const num = match[2];
  if (!num) return alpha + "1";
  return alpha + (parseInt(num, 10) + 1).toString();
}
