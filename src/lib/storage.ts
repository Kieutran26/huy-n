import type { AppSettings } from "@/types";

export const KEYS = {
  DOCUMENTS: "dcs_documents",
  DISTRIBUTIONS: "dcs_distributions",
  EMPLOYEES: "dcs_employees",
  SETTINGS: "dcs_settings",
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  emailjs: {
    serviceId: "",
    templateId: "",
    publicKey: "",
  },
};

/** Lấy mảng dữ liệu từ localStorage theo key. */
export function getItem<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Ghi mảng dữ liệu vào localStorage theo key. */
export function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Thêm mới hoặc cập nhật 1 phần tử theo id. */
export function upsertItem<T extends { id: string }>(key: string, item: T): void {
  const list = getItem<T>(key);
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  setItem(key, list);
}

/** Xóa 1 phần tử theo id. */
export function deleteItem(key: string, id: string): void {
  const list = getItem<{ id: string }>(key);
  setItem(
    key,
    list.filter((x) => x.id !== id)
  );
}

/** Đọc cấu hình ứng dụng (object đơn, không phải mảng). */
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      emailjs: { ...DEFAULT_SETTINGS.emailjs, ...(parsed.emailjs ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Ghi cấu hình ứng dụng. */
export function setSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

/** Xuất toàn bộ dữ liệu thành 1 object để backup. */
export function exportAll() {
  return {
    documents: getItem(KEYS.DOCUMENTS),
    distributions: getItem(KEYS.DISTRIBUTIONS),
    employees: getItem(KEYS.EMPLOYEES),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
}

/** Nhập dữ liệu từ object backup, ghi đè dữ liệu hiện tại. */
export function importAll(data: {
  documents?: unknown[];
  distributions?: unknown[];
  employees?: unknown[];
  settings?: AppSettings;
}): void {
  if (Array.isArray(data.documents)) setItem(KEYS.DOCUMENTS, data.documents);
  if (Array.isArray(data.distributions))
    setItem(KEYS.DISTRIBUTIONS, data.distributions);
  if (Array.isArray(data.employees)) setItem(KEYS.EMPLOYEES, data.employees);
  if (data.settings) setSettings(data.settings);
}

/** Xóa toàn bộ dữ liệu ứng dụng. */
export function clearAll(): void {
  localStorage.removeItem(KEYS.DOCUMENTS);
  localStorage.removeItem(KEYS.DISTRIBUTIONS);
  localStorage.removeItem(KEYS.EMPLOYEES);
  localStorage.removeItem(KEYS.SETTINGS);
}
