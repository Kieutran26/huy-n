import { useCallback, useSyncExternalStore } from "react";
import type { Document } from "@/types";
import { KEYS } from "@/lib/storage";
import { getSnapshot, subscribe, writeStore } from "@/lib/store";
import { genId } from "@/lib/utils";

export function useDocuments() {
  const documents = useSyncExternalStore(
    (cb) => subscribe(KEYS.DOCUMENTS, cb),
    () => getSnapshot<Document>(KEYS.DOCUMENTS)
  );

  const addDocument = useCallback(
    (data: Omit<Document, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const doc: Document = { ...data, id: genId(), createdAt: now, updatedAt: now };
      writeStore(KEYS.DOCUMENTS, [...getSnapshot<Document>(KEYS.DOCUMENTS), doc]);
      return doc;
    },
    []
  );

  const updateDocument = useCallback((doc: Document) => {
    const list = getSnapshot<Document>(KEYS.DOCUMENTS).map((d) =>
      d.id === doc.id ? { ...doc, updatedAt: new Date().toISOString() } : d
    );
    writeStore(KEYS.DOCUMENTS, list);
  }, []);

  const deleteDocument = useCallback((id: string) => {
    writeStore(
      KEYS.DOCUMENTS,
      getSnapshot<Document>(KEYS.DOCUMENTS).filter((d) => d.id !== id)
    );
  }, []);

  /**
   * Import/upsert theo docCode (không xóa data cũ).
   * Trả về số bản ghi thêm mới và cập nhật.
   */
  const importDocuments = useCallback(
    (incoming: Omit<Document, "createdAt" | "updatedAt">[]) => {
      const now = new Date().toISOString();
      const list = [...getSnapshot<Document>(KEYS.DOCUMENTS)];
      let added = 0;
      let updated = 0;
      for (const item of incoming) {
        const idx = list.findIndex((d) => d.docCode === item.docCode);
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            docName: item.docName || list[idx].docName,
            docType: item.docType || list[idx].docType,
            currentRev: item.currentRev || list[idx].currentRev,
            issueDate: item.issueDate || list[idx].issueDate,
            updatedAt: now,
          };
          updated++;
        } else {
          list.push({ ...item, createdAt: now, updatedAt: now });
          added++;
        }
      }
      writeStore(KEYS.DOCUMENTS, list);
      return { added, updated };
    },
    []
  );

  return { documents, addDocument, updateDocument, deleteDocument, importDocuments };
}
