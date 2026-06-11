import { useMemo, useState } from "react";
import { ArrowUpDown, FilePlus2, History, Edit2, Trash2 } from "lucide-react";
import type { Distribution, Document } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { currentRevOf } from "@/lib/revUtils";

type SortKey = "docCode" | "docName" | "docType" | "currentRev" | "issueDate";

interface DocumentTableProps {
  documents: Document[];
  distributions: Distribution[];
  onIssue: (doc: Document) => void;
  onHistory: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export function DocumentTable({
  documents,
  distributions,
  onIssue,
  onHistory,
  onEdit,
  onDelete,
}: DocumentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("docCode");
  const [asc, setAsc] = useState(true);

  // Rev hiện hành dựa trên distribution mới nhất.
  const rows = useMemo(
    () =>
      documents.map((d) => ({
        doc: d,
        currentRev: currentRevOf(distributions, d.docCode, d.currentRev),
      })),
    [documents, distributions]
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let va: string;
      let vb: string;
      if (sortKey === "currentRev") {
        va = a.currentRev;
        vb = b.currentRev;
      } else {
        va = String(a.doc[sortKey] ?? "");
        vb = String(b.doc[sortKey] ?? "");
      }
      const cmp = va.localeCompare(vb, "vi", { numeric: true });
      return asc ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      setAsc(true);
    }
  }

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead>
      <button
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          sortKey === k && "text-foreground"
        )}
        onClick={() => toggleSort(k)}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">STT</TableHead>
            <SortHead label="Mã tài liệu" k="docCode" />
            <SortHead label="Tên tài liệu" k="docName" />
            <SortHead label="Loại" k="docType" />
            <SortHead label="Rev hiện hành" k="currentRev" />
            <SortHead label="Ngày ban hành" k="issueDate" />
            <TableHead className="text-right w-60">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(({ doc, currentRev }, i) => (
            <TableRow key={doc.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{doc.docCode}</TableCell>
              <TableCell>{doc.docName}</TableCell>
              <TableCell>{doc.docType || "—"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{currentRev || "—"}</Badge>
              </TableCell>
              <TableCell>{formatDate(doc.issueDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="sm" onClick={() => onIssue(doc)} title="Ban hành Rev mới">
                    <FilePlus2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onHistory(doc)}
                    title="Lịch sử phân phát"
                  >
                    <History className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(doc)} title="Chỉnh sửa">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(doc)} title="Xóa tài liệu">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
