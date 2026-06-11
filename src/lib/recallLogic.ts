import type { Distribution, Document } from "@/types";
import { currentRevOf } from "./revUtils";

/**
 * Trả về các distribution cần thu hồi:
 * recalled=false VÀ có rev khác (cũ hơn) so với rev hiện hành của docCode.
 */
export function pendingRecalls(
  distributions: Distribution[],
  documents: Document[] = []
): Distribution[] {
  const docMap = new Map<string, string>();
  for (const doc of documents) {
    docMap.set(doc.docCode.toUpperCase(), doc.currentRev);
  }

  return distributions.filter((d) => {
    if (d.recalled) return false;
    const codeKey = d.docCode.toUpperCase();
    const activeRev = docMap.get(codeKey) || currentRevOf(distributions, d.docCode);
    return d.rev.trim().toUpperCase() !== activeRev.trim().toUpperCase();
  });
}

/** Các distribution đang lưu hành (recalled=false) của 1 docCode — danh sách cần thu hồi khi ban hành rev mới. */
export function activeDistributions(
  distributions: Distribution[],
  docCode: string
): Distribution[] {
  return distributions.filter((d) => d.docCode === docCode && !d.recalled);
}
