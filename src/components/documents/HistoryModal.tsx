import { useMemo } from "react";
import type { Distribution, Document } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { compareDate, formatDate } from "@/lib/utils";

interface HistoryModalProps {
  open: boolean;
  doc: Document | null;
  distributions: Distribution[];
  onOpenChange: (open: boolean) => void;
}

/** Khóa sắp xếp Rev: số đứng trước theo giá trị, chữ-số theo bảng chữ cái. */
function revSortKey(rev: string): [number, string, number] {
  const r = rev.trim();
  if (/^\d+$/.test(r)) return [0, "", parseInt(r, 10)];
  const m = r.match(/^(.*?)(\d*)$/);
  return [1, (m?.[1] ?? r).toUpperCase(), m?.[2] ? parseInt(m[2], 10) : 0];
}

export function HistoryModal({
  open,
  doc,
  distributions,
  onOpenChange,
}: HistoryModalProps) {
  const rows = useMemo(() => {
    if (!doc) return [];
    return distributions
      .filter((d) => d.docCode === doc.docCode)
      .sort((a, b) => {
        // Rev mới nhất (ngày phân phát lớn nhất) lên đầu, sau đó theo rev.
        const byDate = compareDate(b.distributionDate, a.distributionDate);
        if (byDate !== 0) return byDate;
        const ka = revSortKey(a.rev);
        const kb = revSortKey(b.rev);
        if (ka[0] !== kb[0]) return kb[0] - ka[0];
        if (ka[1] !== kb[1]) return kb[1].localeCompare(ka[1]);
        return kb[2] - ka[2];
      });
  }, [doc, distributions]);

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            Lịch sử phân phát — {doc.docCode}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{doc.docName}</p>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa có lịch sử phân phát cho tài liệu này.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rev</TableHead>
                  <TableHead>Loại TL</TableHead>
                  <TableHead>Chi tiết</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Người nhận</TableHead>
                  <TableHead>Bộ phận</TableHead>
                  <TableHead>Ngày phân phát</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày thu hồi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.rev}</TableCell>
                    <TableCell>
                      <Badge variant={d.docType === "Bản sao" ? "warning" : "success"}>
                        {d.docType || "Bản gốc"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate" title={d.detail}>
                      {d.detail || "—"}
                    </TableCell>
                    <TableCell>{d.quantity || "N/A"}</TableCell>
                    <TableCell>
                      {d.fullName}{" "}
                      <span className="text-muted-foreground">({d.employeeId})</span>
                    </TableCell>
                    <TableCell>{d.dept}</TableCell>
                    <TableCell>{formatDate(d.distributionDate)}</TableCell>
                    <TableCell>
                      {d.recalled ? (
                        <Badge variant="muted">Đã thu hồi</Badge>
                      ) : (
                        <Badge variant="success">Đang giữ</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(d.recalledDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
