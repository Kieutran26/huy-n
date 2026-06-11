import { useMemo, useRef, useState } from "react";
import { Download, FileText, Search, Upload, FileUp, Plus, Trash2 } from "lucide-react";
import type { Document, Employee } from "@/types";
import { useDocuments } from "@/hooks/useDocuments";
import { useDistributions } from "@/hooks/useDistributions";
import { useEmployees } from "@/hooks/useEmployees";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { ImportExcelModal } from "@/components/documents/ImportExcelModal";
import { IssueRevModal } from "@/components/documents/IssueRevModal";
import { HistoryModal } from "@/components/documents/HistoryModal";
import { DocumentFormModal, type DocumentFormValues } from "@/components/documents/DocumentFormModal";
import type { ParsedExcel } from "@/lib/excelParser";
import { currentRevOf } from "@/lib/revUtils";
import { sendRecallEmail, isEmailConfigured } from "@/lib/emailService";
import { backupFilename, downloadJSON, readJSONFile } from "@/lib/fileUtils";
import { exportAll, importAll } from "@/lib/storage";
import { invalidate } from "@/lib/store";
import { KEYS } from "@/lib/storage";
import { todayISO } from "@/lib/utils";

export default function Documents() {
  const { documents, addDocument, updateDocument, deleteDocument, deleteManyDocuments, importDocuments } = useDocuments();
  const { distributions, addMany, importDistributions } = useDistributions();
  const { employees, addEmployee } = useEmployees();

  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [issueDoc, setIssueDoc] = useState<Document | null>(null);
  const [historyDoc, setHistoryDoc] = useState<Document | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Selection states
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDocOpen, setBulkDeleteDocOpen] = useState(false);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [toDeleteDoc, setToDeleteDoc] = useState<Document | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.docCode.toLowerCase().includes(q) ||
        d.docName.toLowerCase().includes(q) ||
        (d.customer && d.customer.toLowerCase().includes(q))
    );
  }, [documents, search]);

  // Selection logic
  const allSelected = useMemo(() => {
    return filtered.length > 0 && filtered.every((d) => selectedDocIds.has(d.id));
  }, [filtered, selectedDocIds]);

  function handleToggleSelect(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleToggleSelectAll() {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach((d) => next.delete(d.id));
      } else {
        filtered.forEach((d) => next.add(d.id));
      }
      return next;
    });
  }

  function handleBulkDeleteDocs() {
    deleteManyDocuments(Array.from(selectedDocIds));
    toast.success(`Đã xóa ${selectedDocIds.size} tài liệu`);
    setSelectedDocIds(new Set());
    setBulkDeleteDocOpen(false);
  }

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
        docType: "Bản gốc",
        detail: "",
        quantity: "N/A",
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

  // --- Manual Add/Edit/Delete ---
  function handleFormSubmit(values: DocumentFormValues) {
    if (editingDoc) {
      updateDocument({
        ...editingDoc,
        ...values,
      });
      toast.success("Đã cập nhật tài liệu");
      setEditingDoc(null);
    } else {
      addDocument(values);
      toast.success("Đã thêm mới tài liệu thành công");
    }
  }

  function confirmDeleteDoc() {
    if (!toDeleteDoc) return;
    deleteDocument(toDeleteDoc.id);
    toast.success("Đã xóa tài liệu");
    setToDeleteDoc(null);
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
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" /> Import Excel
            </Button>
            <Button onClick={() => {
              setEditingDoc(null);
              setFormOpen(true);
            }}>
              <Plus className="h-4 w-4" /> Thêm tài liệu
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
            placeholder="Tìm theo mã, tên hoặc khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Chưa có tài liệu"
          description="Bấm 'Thêm tài liệu' hoặc Import file Excel để bắt đầu quản lý tài liệu và phân phát."
          action={
            <div className="flex gap-2">
              <Button onClick={() => {
                setEditingDoc(null);
                setFormOpen(true);
              }}>
                <Plus className="h-4 w-4" /> Thêm tài liệu
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileUp className="h-4 w-4" /> Import Excel
              </Button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Không tìm thấy tài liệu"
          description="Thử từ khóa khác."
        />
      ) : (
        <>
          {/* Thanh hành động hàng loạt */}
          {selectedDocIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-medium">
                <span>Đã chọn <b>{selectedDocIds.size}</b> tài liệu</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setBulkDeleteDocOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Xóa hàng loạt
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-800 hover:bg-red-100"
                  onClick={() => setSelectedDocIds(new Set())}
                >
                  Hủy chọn
                </Button>
              </div>
            </div>
          )}

          <DocumentTable
            documents={filtered}
            distributions={distributions}
            onIssue={(doc) => setIssueDoc(doc)}
            onHistory={(doc) => setHistoryDoc(doc)}
            onEdit={(doc) => setEditingDoc(doc)}
            onDelete={(doc) => setToDeleteDoc(doc)}
            selectedIds={selectedDocIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            allSelected={allSelected}
          />
        </>
      )}

      {/* Import Excel Modal */}
      <ImportExcelModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onConfirm={handleExcelImport}
      />

      {/* Issue Rev Modal */}
      <IssueRevModal
        open={!!issueDoc}
        doc={issueDoc}
        distributions={distributions}
        employees={employees}
        onOpenChange={(o) => !o && setIssueDoc(null)}
        onConfirm={handleIssue}
      />

      {/* History Modal */}
      <HistoryModal
        open={!!historyDoc}
        doc={historyDoc}
        distributions={distributions}
        onOpenChange={(o) => !o && setHistoryDoc(null)}
      />

      {/* Add / Edit Document Modal */}
      <DocumentFormModal
        open={formOpen || !!editingDoc}
        initial={editingDoc}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingDoc(null);
        }}
        onSubmit={handleFormSubmit}
        existingCodes={documents.map((d) => d.docCode)}
      />

      {/* Confirm Delete Document Dialog */}
      <ConfirmDialog
        open={!!toDeleteDoc}
        title="Xác nhận xóa tài liệu?"
        description={
          toDeleteDoc
            ? `Bạn có chắc chắn muốn xóa tài liệu ${toDeleteDoc.docCode} (${toDeleteDoc.docName})? Lịch sử phân phát của tài liệu này vẫn sẽ được giữ lại.`
            : ""
        }
        confirmText="Xóa"
        destructive
        onConfirm={confirmDeleteDoc}
        onOpenChange={(o) => !o && setToDeleteDoc(null)}
      />

      {/* Confirm Bulk Delete Documents Dialog */}
      <ConfirmDialog
        open={bulkDeleteDocOpen}
        title="Xác nhận xóa hàng loạt tài liệu?"
        description={`Bạn có chắc chắn muốn xóa ${selectedDocIds.size} tài liệu đã chọn? Lịch sử phân phát của những tài liệu này vẫn sẽ được giữ lại.`}
        confirmText="Xóa tất cả"
        destructive
        onConfirm={handleBulkDeleteDocs}
        onOpenChange={setBulkDeleteDocOpen}
      />
    </>
  );
}
