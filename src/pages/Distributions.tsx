import { useMemo, useState } from "react";
import { Send, Plus, Undo2, Trash2 } from "lucide-react";
import type { Distribution } from "@/types";
import { useDistributions } from "@/hooks/useDistributions";
import { useDocuments } from "@/hooks/useDocuments";
import { useEmployees } from "@/hooks/useEmployees";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { DistributionTable } from "@/components/distributions/DistributionTable";
import { DistributionFormModal, type DistributionFormValues } from "@/components/distributions/DistributionFormModal";
import { compareDate } from "@/lib/utils";

type StatusFilter = "all" | "active" | "recalled";

export default function Distributions() {
  const {
    distributions,
    addDistribution,
    updateDistribution,
    deleteDistribution,
    deleteManyDistributions,
    recallDistribution,
    recallManyDistributions,
  } = useDistributions();
  const { documents } = useDocuments();
  const { employees } = useEmployees();

  const [docFilter, setDocFilter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Modals / Actions states
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Distribution | null>(null);
  const [toRecall, setToRecall] = useState<Distribution | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const docCodes = useMemo(
    () => Array.from(new Set(distributions.map((d) => d.docCode))).sort(),
    [distributions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return distributions
      .filter((d) => (docFilter === "all" ? true : d.docCode === docFilter))
      .filter((d) =>
        status === "all"
          ? true
          : status === "active"
          ? !d.recalled
          : d.recalled
      )
      .filter((d) =>
        q
          ? d.fullName.toLowerCase().includes(q) ||
            d.employeeId.toLowerCase().includes(q) ||
            (d.detail && d.detail.toLowerCase().includes(q))
          : true
      )
      .sort((a, b) => compareDate(b.distributionDate, a.distributionDate));
  }, [distributions, docFilter, status, search]);

  // Bulk actions logic
  const allSelected = useMemo(() => {
    return filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id));
  }, [filtered, selectedIds]);

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleToggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach((d) => next.delete(d.id));
      } else {
        filtered.forEach((d) => next.add(d.id));
      }
      return next;
    });
  }

  function handleBulkRecall() {
    const ids = Array.from(selectedIds);
    // Chỉ thu hồi các bản chưa thu hồi
    const activeIdsToRecall = ids.filter((id) => {
      const dist = distributions.find((d) => d.id === id);
      return dist && !dist.recalled;
    });

    if (activeIdsToRecall.length === 0) {
      toast.info("Tất cả các bản ghi đã chọn đều đã ở trạng thái thu hồi.");
      return;
    }

    recallManyDistributions(activeIdsToRecall);
    toast.success(`Đã thu hồi ${activeIdsToRecall.length} bản ghi phân phát`);
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    deleteManyDistributions(Array.from(selectedIds));
    toast.success(`Đã xóa ${selectedIds.size} bản ghi phân phát`);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  }

  function confirmRecall() {
    if (!toRecall) return;
    recallDistribution(toRecall.id);
    toast.success("Đã đánh dấu thu hồi");
    setToRecall(null);
  }

  function handleFormSubmit(values: DistributionFormValues) {
    if (editing) {
      updateDistribution({
        ...editing,
        ...values,
      });
      toast.success("Đã cập nhật bản ghi phân phát");
      setEditing(null);
    } else {
      addDistribution(values);
      toast.success("Đã ghi nhận phân phát thành công");
    }
  }

  function confirmDelete() {
    if (!toDeleteId) return;
    deleteDistribution(toDeleteId);
    toast.success("Đã xóa bản ghi phân phát");
    setToDeleteId(null);
  }

  return (
    <>
      <PageHeader
        title="Phân phát & Thu hồi"
        breadcrumb="Document Control / Phân phát & Thu hồi"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Ghi nhận phân phát
          </Button>
        }
      />

      {distributions.length === 0 ? (
        <EmptyState
          icon={<Send className="h-6 w-6" />}
          title="Chưa có dữ liệu phân phát"
          description="Bấm 'Ghi nhận phân phát', Import file Excel hoặc ban hành Rev mới ở trang Tài liệu để tạo bản ghi phân phát."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Ghi nhận phân phát
            </Button>
          }
        />
      ) : (
        <>
          {/* Thanh hành động hàng loạt */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-medium">
                <span>Đã chọn <b>{selectedIds.size}</b> bản ghi phân phát</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-900 hover:bg-amber-100/50"
                  onClick={handleBulkRecall}
                >
                  <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Thu hồi hàng loạt
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Xóa hàng loạt
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-amber-800 hover:bg-amber-100"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Hủy chọn
                </Button>
              </div>
            </div>
          )}

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Mã tài liệu</Label>
              <Select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {docCodes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang giữ</option>
                <option value="recalled">Đã thu hồi</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tìm nhân viên hoặc chi tiết</Label>
              <Input
                placeholder="Tên, MSNV hoặc trang photo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Send className="h-6 w-6" />}
              title="Không có bản ghi phù hợp"
              description="Điều chỉnh bộ lọc hoặc từ khóa tìm kiếm."
            />
          ) : (
            <DistributionTable
              distributions={filtered}
              onRecall={(d) => setToRecall(d)}
              onEdit={(d) => setEditing(d)}
              onDelete={(id) => setToDeleteId(id)}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              allSelected={allSelected}
            />
          )}
        </>
      )}

      {/* Confirm Recall Dialog */}
      <ConfirmDialog
        open={!!toRecall}
        title="Xác nhận thu hồi"
        description={
          toRecall
            ? `Xác nhận đã thu hồi bản Rev ${toRecall.rev} (${toRecall.docType || "Bản gốc"}${toRecall.detail ? ` - ${toRecall.detail}` : ""}) của ${toRecall.fullName} (${toRecall.employeeId})?`
            : ""
        }
        confirmText="Đã thu hồi"
        onConfirm={confirmRecall}
        onOpenChange={(o) => !o && setToRecall(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!toDeleteId}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa bản ghi phân phát này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        destructive
        onConfirm={confirmDelete}
        onOpenChange={(o) => !o && setToDeleteId(null)}
      />

      {/* Confirm Bulk Delete Dialog */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Xác nhận xóa hàng loạt?"
        description={`Bạn có chắc chắn muốn xóa ${selectedIds.size} bản ghi phân phát đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        destructive
        onConfirm={handleBulkDelete}
        onOpenChange={setBulkDeleteOpen}
      />

      {/* Add / Edit Form Modal */}
      <DistributionFormModal
        open={formOpen || !!editing}
        initial={editing}
        documents={documents}
        employees={employees}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
