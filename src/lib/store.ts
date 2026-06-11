import { getItem, setItem } from "./storage";

type Listener = () => void;

/**
 * Store nhỏ bọc quanh localStorage, hỗ trợ subscribe để các component
 * tự re-render khi dữ liệu thay đổi (dùng với useSyncExternalStore).
 */
const listeners = new Map<string, Set<Listener>>();
const caches = new Map<string, unknown[]>();

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

export function subscribe(key: string, listener: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  return () => listeners.get(key)?.delete(listener);
}

/** Lấy snapshot ổn định (cùng tham chiếu nếu không đổi) cho useSyncExternalStore. */
export function getSnapshot<T>(key: string): T[] {
  const fresh = getItem<T>(key);
  const cached = caches.get(key) as T[] | undefined;
  if (cached && shallowEqualArray(cached, fresh)) {
    return cached;
  }
  caches.set(key, fresh);
  return fresh;
}

/** Ghi dữ liệu và thông báo cho subscribers. */
export function writeStore<T>(key: string, data: T[]): void {
  setItem(key, data);
  caches.set(key, data);
  emit(key);
}

/** Buộc làm mới cache + thông báo (dùng sau import/restore hàng loạt). */
export function invalidate(key: string): void {
  caches.delete(key);
  emit(key);
}

function shallowEqualArray(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
