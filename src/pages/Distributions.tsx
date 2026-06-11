import { useMemo, useState } from "react";
import { Send, Plus } from "lucide-react";
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
  const { distributions, addDistribution, updateDistribution, deleteDistribution, recallDistribution } = useDistributions();
  const { documents } = useDocuments();
  const { employees } = useEmployees();

  const [docFilter, setDocFilter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  
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
