import type { Distribution } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Undo2, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DistributionTableProps {
  distributions: Distribution[];
  onRecall: (dist: Distribution) => void;
  onEdit: (dist: Distribution) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
}

export function DistributionTable({
  distributions,
  onRecall,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
}: DistributionTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              <Checkbox
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </TableHead>
            <TableHead className="w-12">STT</TableHead>
            <TableHead>Mã TL</TableHead>
            <TableHead>Tên TL</TableHead>
            <TableHead>Rev</TableHead>
            <TableHead>Loại TL</TableHead>
            <TableHead>Chi tiết</TableHead>
            <TableHead>Số lượng</TableHead>
            <TableHead>MSNV</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Bộ phận</TableHead>
            <TableHead>Ngày phân phát</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày thu hồi</TableHead>
            <TableHead className="text-right w-44">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distributions.map((d, i) => (
            <TableRow key={d.id} className={selectedIds.has(d.id) ? "bg-muted/30" : ""}>
              <TableCell className="text-center">
                <Checkbox
                  checked={selectedIds.has(d.id)}
                  onChange={() => onToggleSelect(d.id)}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{d.docCode}</TableCell>
              <TableCell>{d.docName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{d.rev}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={d.docType === "Bản sao" ? "warning" : "success"}>
                  {d.docType || "Bản gốc"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[150px] truncate" title={d.detail}>
                {d.detail || "—"}
              </TableCell>
              <TableCell>{d.quantity || "N/A"}</TableCell>
              <TableCell>{d.employeeId}</TableCell>
              <TableCell>{d.fullName}</TableCell>
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
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(d)} title="Chỉnh sửa">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(d.id)} title="Xóa">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {!d.recalled && (
                    <Button size="sm" variant="outline" onClick={() => onRecall(d)}>
                      <Undo2 className="h-3.5 w-3.5 mr-1" /> Thu hồi
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
