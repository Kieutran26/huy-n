import emailjs from "@emailjs/browser";
import { format } from "date-fns";
import type { Document, Employee, EmailJSConfig } from "@/types";
import { getSettings } from "./storage";

export interface SendRecallEmailArgs {
  employee: Employee;
  doc: Pick<Document, "docCode" | "docName">;
  oldRev: string;
  newRev: string;
}

export interface SendResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
}

/** Kiểm tra EmailJS đã được cấu hình đầy đủ chưa. */
export function isEmailConfigured(cfg?: EmailJSConfig): boolean {
  const c = cfg ?? getSettings().emailjs;
  return Boolean(c.serviceId && c.templateId && c.publicKey);
}

/**
 * Gửi email thông báo phát hành Rev mới cho 1 nhân viên.
 * - Chưa config EmailJS hoặc nhân viên không có email → skip (không throw).
 * - Gửi fail → trả về sent:false kèm reason (không throw).
 */
export async function sendRecallEmail(
  args: SendRecallEmailArgs
): Promise<SendResult> {
  const cfg = getSettings().emailjs;

  if (!isEmailConfigured(cfg)) {
    return { sent: false, skipped: true, reason: "EmailJS chưa được cấu hình" };
  }
  if (!args.employee.email) {
    return {
      sent: false,
      skipped: true,
      reason: `${args.employee.fullName} chưa có email`,
    };
  }

  const templateParams = {
    to_email: args.employee.email,
    to_name: args.employee.fullName,
    doc_code: args.doc.docCode,
    doc_name: args.doc.docName,
    old_rev: args.oldRev,
    new_rev: args.newRev,
    issue_date: format(new Date(), "dd/MM/yyyy"),
  };

  try {
    await emailjs.send(cfg.serviceId, cfg.templateId, templateParams, {
      publicKey: cfg.publicKey,
    });
    return { sent: true, skipped: false };
  } catch (err) {
    console.error("EmailJS send failed:", err);
    return {
      sent: false,
      skipped: false,
      reason: err instanceof Error ? err.message : "Gửi email thất bại",
    };
  }
}

/** Gửi email test tới 1 địa chỉ bất kỳ, dùng ở trang Settings. */
export async function sendTestEmail(
  cfg: EmailJSConfig,
  toEmail: string
): Promise<SendResult> {
  if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) {
    return { sent: false, skipped: true, reason: "Thiếu thông tin cấu hình" };
  }
  const templateParams = {
    to_email: toEmail,
    to_name: "Người nhận thử nghiệm",
    doc_code: "EN-WI0000",
    doc_name: "Email thử nghiệm",
    old_rev: "01",
    new_rev: "02",
    issue_date: format(new Date(), "dd/MM/yyyy"),
  };
  try {
    await emailjs.send(cfg.serviceId, cfg.templateId, templateParams, {
      publicKey: cfg.publicKey,
    });
    return { sent: true, skipped: false };
  } catch (err) {
    console.error("EmailJS test failed:", err);
    return {
      sent: false,
      skipped: false,
      reason: err instanceof Error ? err.message : "Gửi email thất bại",
    };
  }
}
