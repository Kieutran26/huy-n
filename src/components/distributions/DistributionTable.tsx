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
import { Undo2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DistributionTableProps {
  distributions: Distribution[];
  onRecall: (dist: Distribution) => void;
}

export function DistributionTable({
  distributions,
  onRecall,
}: DistributionTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">STT</TableHead>
            <TableHead>Mã TL</TableHead>
            <TableHead>Tên TL</TableHead>
            <TableHead>Rev</TableHead>
            <TableHead>MSNV</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Bộ phận</TableHead>
            <TableHead>Ngày phân phát</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày thu hồi</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distributions.map((d, i) => (
            <TableRow key={d.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{d.docCode}</TableCell>
              <TableCell>{d.docName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{d.rev}</Badge>
              </TableCell>
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
                {!d.recalled && (
                  <Button size="sm" variant="outline" onClick={() => onRecall(d)}>
                    <Undo2 className="h-3.5 w-3.5" /> Thu hồi
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
