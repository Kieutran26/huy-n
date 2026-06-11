import { useMemo, useState } from "react";
import {
  FileText,
  Send,
  Users,
  AlertTriangle,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import type { Distribution } from "@/types";
import { useDocuments } from "@/hooks/useDocuments";
import { useDistributions } from "@/hooks/useDistributions";
import { useEmployees } from "@/hooks/useEmployees";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pendingRecalls } from "@/lib/recallLogic";
import { compareDate, formatDate, isToday } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${accent}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { documents } = useDocuments();
  const { distributions, recallDistribution } = useDistributions();
  const { employees } = useEmployees();
  const [toRecall, setToRecall] = useState<Distribution | null>(null);

  const pending = useMemo(() => pendingRecalls(distributions, documents), [distributions, documents]);

  const issuedToday = useMemo(
    () => distributions.filter((d) => isToday(d.distributionDate)).length,
    [distributions]
  );

  // Ban hành gần đây: gom theo docCode + rev + ngày phân phát.
  const recent = useMemo(() => {
    const map = new Map<
      string,
      {
        docCode: string;
        docName: string;
        rev: string;
        date: string;
        count: number;
      }
    >();
    for (const d of distributions) {
      const key = `${d.docCode}__${d.rev}__${d.distributionDate}`;
      const cur = map.get(key);
      if (cur) {
        cur.count++;
      } else {
        map.set(key, {
          docCode: d.docCode,
          docName: d.docName,
          rev: d.rev,
          date: d.distributionDate,
          count: 1,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => compareDate(b.date, a.date))
      .slice(0, 10);
  }, [distributions]);

  function confirmRecall() {
    if (!toRecall) return;
    recallDistribution(toRecall.id);
    toast.success("Đã đánh dấu thu hồi");
    setToRecall(null);
  }

  return (
    <>
      <PageHeader title="Dashboard" breadcrumb="Document Control / Tổng quan" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng tài liệu"
          value={documents.length}
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          accent="bg-blue-100"
        />
        <StatCard
          label="Đang chờ thu hồi"
          value={pending.length}
          icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
          accent="bg-amber-100"
        />
        <StatCard
          label="Ban hành hôm nay"
          value={issuedToday}
          icon={<Send className="h-6 w-6 text-green-600" />}
          accent="bg-green-100"
        />
        <StatCard
          label="Nhân viên"
          value={employees.length}
          icon={<Users className="h-6 w-6 text-violet-600" />}
          accent="bg-violet-100"
        />
      </div>

      {/* Task thu hồi cần xử lý */}
      <Card className="mb-6">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Task thu hồi cần xử lý</h2>
          {pending.length > 0 && (
            <Badge variant="warning">{pending.length} bản</Badge>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
              title="Không có task thu hồi"
              description="Tất cả các bản Rev cũ đã được thu hồi."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã tài liệu</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Rev</TableHead>
                <TableHead>Loại TL</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Người giữ</TableHead>
                <TableHead>Bộ phận</TableHead>
                <TableHead>Ngày phân phát</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((d) => (
                <TableRow key={d.id}>
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
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setToRecall(d)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đã thu hồi
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Ban hành gần đây */}
      <Card>
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Ban hành gần đây</h2>
        </div>
        {recent.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="Chưa có hoạt động ban hành"
              description="Import Excel hoặc ban hành Rev mới để xem tại đây."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Rev</TableHead>
                <TableHead>Ngày ban hành</TableHead>
                <TableHead className="text-right">Số người nhận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.docCode}</TableCell>
                  <TableCell>{r.docName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.rev}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

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
    </>
  );
}
