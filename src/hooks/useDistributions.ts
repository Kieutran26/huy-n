import { useCallback, useSyncExternalStore } from "react";
import type { Distribution } from "@/types";
import { KEYS } from "@/lib/storage";
import { getSnapshot, subscribe, writeStore } from "@/lib/store";
import { genId } from "@/lib/utils";
import { todayISO } from "@/lib/utils";

/** Khóa nhận diện trùng: docCode + rev + employeeId + distributionDate. */
function dupKey(d: {
  docCode: string;
  rev: string;
  employeeId: string;
  distributionDate: string;
}): string {
  return `${d.docCode}__${d.rev}__${d.employeeId}__${d.distributionDate}`;
}

export function useDistributions() {
  const distributions = useSyncExternalStore(
    (cb) => subscribe(KEYS.DISTRIBUTIONS, cb),
    () => getSnapshot<Distribution>(KEYS.DISTRIBUTIONS)
  );

  const addDistribution = useCallback(
    (data: Omit<Distribution, "id" | "createdAt">) => {
      const dist: Distribution = {
        ...data,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      writeStore(KEYS.DISTRIBUTIONS, [
        ...getSnapshot<Distribution>(KEYS.DISTRIBUTIONS),
        dist,
      ]);
      return dist;
    },
    []
  );

  /** Thêm nhiều distribution cùng lúc (khi ban hành Rev mới cho danh sách người nhận). */
  const addMany = useCallback((items: Omit<Distribution, "id" | "createdAt">[]) => {
    const now = new Date().toISOString();
    const created = items.map((d) => ({ ...d, id: genId(), createdAt: now }));
    writeStore(KEYS.DISTRIBUTIONS, [
      ...getSnapshot<Distribution>(KEYS.DISTRIBUTIONS),
      ...created,
    ]);
    return created;
  }, []);

  const recallDistribution = useCallback((id: string) => {
    const list = getSnapshot<Distribution>(KEYS.DISTRIBUTIONS).map((d) =>
      d.id === id ? { ...d, recalled: true, recalledDate: todayISO() } : d
    );
    writeStore(KEYS.DISTRIBUTIONS, list);
  }, []);

  /** Import append, bỏ qua bản ghi trùng theo dupKey. */
  const importDistributions = useCallback(
    (incoming: Omit<Distribution, "createdAt">[]) => {
      const now = new Date().toISOString();
      const existing = getSnapshot<Distribution>(KEYS.DISTRIBUTIONS);
      const seen = new Set(existing.map(dupKey));
      let added = 0;
      let skipped = 0;
      const list = [...existing];
      for (const item of incoming) {
        const key = dupKey(item);
        if (seen.has(key)) {
          skipped++;
          continue;
        }
        seen.add(key);
        list.push({ ...item, createdAt: now });
        added++;
      }
      writeStore(KEYS.DISTRIBUTIONS, list);
      return { added, skipped };
    },
    []
  );

  return {
    distributions,
    addDistribution,
    addMany,
    recallDistribution,
    importDistributions,
  };
}
