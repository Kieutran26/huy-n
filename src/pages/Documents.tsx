import { useMemo, useRef, useState } from "react";
import { Download, FileText, Search, Upload, FileUp } from "lucide-react";
import type { Document, Employee } from "@/types";
import { useDocuments } from "@/hooks/useDocuments";
import { useDistributions } from "@/hooks/useDistributions";
import { useEmployees } from "@/hooks/useEmployees";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ImportExcelModal } from "@/components/documents/ImportExcelModal";
import { IssueRevModal } from "@/components/documents/IssueRevModal";
import { HistoryModal } from "@/components/documents/HistoryModal";
import type { ParsedExcel } from "@/lib/excelParser";
import { currentRevOf } from "@/lib/revUtils";
import { sendRecallEmail, isEmailConfigured } from "@/lib/emailService";
import { backupFilename, downloadJSON, readJSONFile } from "@/lib/fileUtils";
import { exportAll, importAll } from "@/lib/storage";
import { invalidate } from "@/lib/store";
import { KEYS } from "@/lib/storage";
import { todayISO } from "@/lib/utils";

export default function Documents() {
  const { documents, updateDocument, importDocuments } = useDocuments();
  const { distributions, addMany, importDistributions } = useDistributions();
  const { employees, addEmployee } = useEmployees();

  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [issueDoc, setIssueDoc] = useState<Document | null>(null);
  const [historyDoc, setHistoryDoc] = useState<Document | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.docCode.toLowerCase().includes(q) ||
        d.docName.toLowerCase().includes(q)
    );
  }, [documents, search]);

  // --- Import Excel ---
  function handleExcelImport(parsed: ParsedExcel) {
    const docRes = importDocuments(parsed.documents);

    // Tự tạo employee cho MSNV chưa tồn tại.
    const knownIds = new Set(
      employees.map((e) => e.employeeId.toLowerCase())
    );
    const newEmps = new Map<string, { employeeId: string; fullName: string; dept: string }>();
    for (const d of parsed.distributions) {
      const key = d.employeeId.toLowerCase();
      if (!knownIds.has(key) && !newEmps.has(key)) {
        newEmps.set(key, {
          employeeId: d.employeeId,
          fullName: d.fullName,
          dept: d.dept,
        });
      }
    }
    newEmps.forEach((e) =>
      addEmployee({ ...e, email: "" } as Omit<Employee, "id" | "createdAt">)
    );

    const distRes = importDistributions(parsed.distributions);

    toast.success(
      "Import hoàn tất",
      `Tài liệu: +${docRes.added} mới, ${docRes.updated} cập nhật · Phân phát: +${distRes.added} mới, bỏ qua ${distRes.skipped} trùng · Nhân viên mới: ${newEmps.size}`
    );
  }

  // --- Ban hành Rev mới ---
  async function handleIssue(newRev: string, recipients: Employee[]) {
    if (!issueDoc) return;
    const doc = issueDoc;
    const oldRev = currentRevOf(distributions, doc.docCode, doc.currentRev);
    const date = todayISO();

    addMany(
      recipients.map((e) => ({
        docCode: doc.docCode,
        docName: doc.docName,
        rev: newRev,
        employeeId: e.employeeId,
        dept: e.dept,
        fullName: e.fullName,
        distributionDate: date,
        recalled: false,
        recalledDate: null,
      }))
    );

    updateDocument({ ...doc, currentRev: newRev, issueDate: date });
    setIssueDoc(null);
    toast.success(
      `Đã ban hành Rev ${newRev}`,
      `${recipients.length} người nhận. Các bản Rev cũ đang lưu hành đã được đưa vào danh sách thu hồi.`
    );

    // Gửi email (không chặn flow).
    if (isEmailConfigured()) {
      let sent = 0;
      let failed = 0;
      let skipped = 0;
      for (const e of recipients) {
        const res = await sendRecallEmail({
          employee: e,
          doc: { docCode: doc.docCode, docName: doc.docName },
          oldRev,
          newRev,
        });
        if (res.sent) sent++;
        else if (res.skipped) skipped++;
        else failed++;
      }
      if (sent > 0) toast.success(`Đã gửi ${sent} email thông báo`);
      if (failed > 0) toast.error(`${failed} email gửi thất bại`);
      if (skipped > 0) toast.warning(`${skipped} người chưa có email, đã bỏ qua`);
    } else {
      toast.info("EmailJS chưa cấu hình", "Bỏ qua gửi email. Cấu hình tại trang Cài đặt.");
    }
  }

  // --- Backup JSON ---
  function handleExportJSON() {
    downloadJSON(exportAll(), backupFilename());
    toast.success("Đã xuất dữ liệu JSON");
  }

  async function handleImportJSON(file: File) {
    try {
      const data = await readJSONFile<Parameters<typeof importAll>[0]>(file);
      importAll(data);
      invalidate(KEYS.DOCUMENTS);
      invalidate(KEYS.DISTRIBUTIONS);
      invalidate(KEYS.EMPLOYEES);
      toast.success("Đã nhập dữ liệu JSON");
    } catch (err) {
      console.error(err);
      toast.error("File JSON không hợp lệ");
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Tài liệu"
        breadcrumb="Document Control / Tài liệu"
        actions={
          <>
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="h-4 w-4" /> Xuất JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => jsonInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Nhập JSON
            </Button>
            <Button onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" /> Import Excel
            </Button>
            <input
              ref={jsonInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportJSON(f);
              }}
            />
          </>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Tìm theo mã hoặc tên tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Chưa có tài liệu"
          description="Import file Excel để bắt đầu quản lý tài liệu và phân phát."
          action={
            <Button onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" /> Import Excel
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Không tìm thấy tài liệu"
          description="Thử từ khóa khác."
        />
      ) : (
        <DocumentTable
          documents={filtered}
          distributions={distributions}
          onIssue={(doc) => setIssueDoc(doc)}
          onHistory={(doc) => setHistoryDoc(doc)}
        />
      )}

      <ImportExcelModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onConfirm={handleExcelImport}
      />

      <IssueRevModal
        open={!!issueDoc}
        doc={issueDoc}
        distributions={distributions}
        employees={employees}
        onOpenChange={(o) => !o && setIssueDoc(null)}
        onConfirm={handleIssue}
      />

      <HistoryModal
        open={!!historyDoc}
        doc={historyDoc}
        distributions={distributions}
        onOpenChange={(o) => !o && setHistoryDoc(null)}
      />
    </>
  );
}
