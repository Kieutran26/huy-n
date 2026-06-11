import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Tạo id ngẫu nhiên ổn định trên mọi trình duyệt. */
export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Định dạng ngày kiểu dd/MM/yyyy. Trả về "—" nếu không hợp lệ. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = value.length <= 10 ? parseISO(value) : new Date(value);
    if (!isValid(d)) return "—";
    return format(d, "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

/** Ngày hôm nay dạng ISO (yyyy-MM-dd). */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** So sánh 2 ngày ISO, trả về số âm/0/dương. Giá trị rỗng coi là nhỏ nhất. */
export function compareDate(a: string | null, b: string | null): number {
  const ta = a ? new Date(a).getTime() : 0;
  const tb = b ? new Date(b).getTime() : 0;
  return ta - tb;
}

/** Kiểm tra ngày ISO có phải hôm nay không. */
export function isToday(value: string | null | undefined): boolean {
  if (!value) return false;
  return formatDate(value) === formatDate(todayISO());
}
