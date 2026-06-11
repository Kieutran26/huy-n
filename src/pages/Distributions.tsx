import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import type { Distribution } from "@/types";
import { useDistributions } from "@/hooks/useDistributions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { DistributionTable } from "@/components/distributions/DistributionTable";
import { compareDate } from "@/lib/utils";

type StatusFilter = "all" | "active" | "recalled";

export default function Distributions() {
  const { distributions, recallDistribution } = useDistributions();
  const [docFilter, setDocFilter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [toRecall, setToRecall] = useState<Distribution | null>(null);

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
            d.employeeId.toLowerCase().includes(q)
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

  return (
    <>
      <PageHeader
        title="Phân phát & Thu hồi"
        breadcrumb="Document Control / Phân phát & Thu hồi"
      />

      {distributions.length === 0 ? (
        <EmptyState
          icon={<Send className="h-6 w-6" />}
          title="Chưa có dữ liệu phân phát"
          description="Import file Excel hoặc ban hành Rev mới ở trang Tài liệu để tạo bản ghi phân phát."
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
              <Label>Tìm nhân viên</Label>
              <Input
                placeholder="Tên hoặc MSNV..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Send className="h-6 w-6" />}
              title="Không có bản ghi phù hợp"
              description="Điều chỉnh bộ lọc để xem thêm."
            />
          ) : (
            <DistributionTable
              distributions={filtered}
              onRecall={(d) => setToRecall(d)}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toRecall}
        title="Xác nhận thu hồi"
        description={
          toRecall
            ? `Xác nhận đã thu hồi bản Rev ${toRecall.rev} của ${toRecall.fullName} (${toRecall.employeeId})?`
            : ""
        }
        confirmText="Đã thu hồi"
        onConfirm={confirmRecall}
        onOpenChange={(o) => !o && setToRecall(null)}
      />
    </>
  );
}
