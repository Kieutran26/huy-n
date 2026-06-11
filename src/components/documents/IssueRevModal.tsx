import { useEffect, useMemo, useState } from "react";
import { Lightbulb, CheckCircle2, AlertCircle, Search } from "lucide-react";
import type { Distribution, Document, Employee } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  currentRevOf,
  suggestNextRev,
  validateRev,
} from "@/lib/revUtils";

interface IssueRevModalProps {
  open: boolean;
  doc: Document | null;
  distributions: Distribution[];
  employees: Employee[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (newRev: string, recipients: Employee[]) => void;
}

export function IssueRevModal({
  open,
  doc,
  distributions,
  employees,
  onOpenChange,
  onConfirm,
}: IssueRevModalProps) {
  const [newRev, setNewRev] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [empSearch, setEmpSearch] = useState("");

  const currentRev = useMemo(
    () =>
      doc
        ? currentRevOf(distributions, doc.docCode, doc.currentRev)
        : "",
    [doc, distributions]
  );

  const suggestion = useMemo(
    () => (doc ? suggestNextRev(distributions, doc.docCode) : ""),
    [doc, distributions]
  );

  useEffect(() => {
    if (open && doc) {
      setNewRev(suggestNextRev(distributions, doc.docCode));
      setSelected(new Set());
      setEmpSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc]);

  const validation = useMemo(
    () =>
      doc
        ? validateRev(distributions, doc.docCode, newRev)
        : { valid: false },
    [doc, distributions, newRev]
  );

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.employeeId.toLowerCase().includes(q) ||
        e.fullName.toLowerCase().includes(q) ||
        e.dept.toLowerCase().includes(q)
    );
  }, [employees, empSearch]);

  const allSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selected.has(e.id));
  const someSelected = filteredEmployees.some((e) => selected.has(e.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredEmployees.forEach((e) => next.delete(e.id));
      } else {
        filteredEmployees.forEach((e) => next.add(e.id));
      }
      return next;
    });
  }

  function handleConfirm() {
    if (!doc || !validation.valid || selected.size === 0) return;
    const recipients = employees.filter((e) => selected.has(e.id));
    onConfirm(newRev.trim(), recipients);
  }

  if (!doc) return null;

  const canConfirm = validation.valid && selected.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Ban hành phiên bản mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted/60 p-3 text-sm">
            <div>
              <span className="text-muted-foreground">Tài liệu: </span>
              <span className="font-medium">
                {doc.docCode} — {doc.docName}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Rev hiện tại: </span>
              <span className="font-medium">{currentRev || "—"}</span>
            </div>
          </div>

          {/* Rev mới */}
          <div className="space-y-1.5">
            <Label htmlFor="new-rev">
              Rev mới <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-rev"
              value={newRev}
              onInput={(e) => setNewRev((e.target as HTMLInputElement).value)}
              className="max-w-[160px]"
              autoComplete="off"
            />
            {suggestion && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600">
                <Lightbulb className="h-3.5 w-3.5" /> Gợi ý: {suggestion}
              </p>
            )}
            {newRev.trim() &&
              (validation.valid ? (
                <p className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Rev hợp lệ
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> {validation.message}
                </p>
              ))}
          </div>

          {/* Người nhận */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Người nhận <span className="text-destructive">*</span>
              </Label>
              <div className="relative w-40">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-7 text-xs"
                  placeholder="Tìm..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                />
              </div>
            </div>

            {employees.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Chưa có nhân viên. Vui lòng thêm nhân viên trước.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-md border">
                <label className="flex cursor-pointer items-center gap-2 border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={toggleAll}
                  />
                  Chọn tất cả ({filteredEmployees.length})
                </label>
                {filteredEmployees.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selected.has(e.id)}
                      onChange={() => toggle(e.id)}
                    />
                    <span className="font-medium">{e.employeeId}</span>
                    <span className="text-muted-foreground">— {e.fullName}</span>
                    <span className="text-muted-foreground">— {e.dept}</span>
                    {!e.email && (
                      <span className="ml-auto text-[11px] text-amber-600">
                        chưa có email
                      </span>
                    )}
                  </label>
                ))}
                {filteredEmployees.length === 0 && (
                  <p className="px-3 py-3 text-sm text-muted-foreground">
                    Không tìm thấy nhân viên.
                  </p>
                )}
              </div>
            )}
            {selected.size > 0 && (
              <p className="text-xs text-muted-foreground">
                Đã chọn {selected.size} người nhận.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="success" disabled={!canConfirm} onClick={handleConfirm}>
            <CheckCircle2 className="h-4 w-4" /> Xác nhận ban hành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
