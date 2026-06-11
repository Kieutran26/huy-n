import type { Distribution } from "@/types";
import { compareDate } from "./utils";

/**
 * Trả về các distribution cần thu hồi:
 * recalled=false VÀ cùng docCode có distribution khác với distributionDate mới hơn.
 */
export function pendingRecalls(distributions: Distribution[]): Distribution[] {
  // Ngày phân phát mới nhất theo từng docCode.
  const latestByDoc = new Map<string, string>();
  for (const d of distributions) {
    const cur = latestByDoc.get(d.docCode);
    if (!cur || compareDate(d.distributionDate, cur) > 0) {
      latestByDoc.set(d.docCode, d.distributionDate);
    }
  }

  return distributions.filter((d) => {
    if (d.recalled) return false;
    const latest = latestByDoc.get(d.docCode);
    return latest != null && compareDate(d.distributionDate, latest) < 0;
  });
}

/** Các distribution đang lưu hành (recalled=false) của 1 docCode — danh sách cần thu hồi khi ban hành rev mới. */
export function activeDistributions(
  distributions: Distribution[],
  docCode: string
): Distribution[] {
  return distributions.filter((d) => d.docCode === docCode && !d.recalled);
}
