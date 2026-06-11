import { useEffect, useState } from "react";
import type { Document } from "@/types";
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
import { todayISO } from "@/lib/utils";

export interface DocumentFormValues {
  docCode: string;
  docName: string;
  docType: string;
  currentRev: string;
  issueDate: string;
  customer?: string;
  aspPn?: string;
}

interface DocumentFormModalProps {
  open: boolean;
  initial: Document | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DocumentFormValues) => void;
  existingCodes: string[];
}

export function DocumentFormModal({
  open,
  initial,
  onOpenChange,
  onSubmit,
  existingCodes,
}: DocumentFormModalProps) {
  const [docCode, setDocCode] = useState("");
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [currentRev, setCurrentRev] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [aspPn, setAspPn] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (initial) {
        setDocCode(initial.docCode);
        setDocName(initial.docName);
        setDocType(initial.docType || "");
        setCurrentRev(initial.currentRev || "");
        setIssueDate(initial.issueDate || todayISO());
        setCustomer(initial.customer || "");
        setAspPn(initial.aspPn || "");
      } else {
        setDocCode("");
        setDocName("");
        setDocType("WI");
        setCurrentRev("00");
        setIssueDate(todayISO());
        setCustomer("");
        setAspPn("");
      }
    }
  }, [open, initial]);

  const handleConfirm = () => {
    if (!docCode.trim() || !docName.trim() || !currentRev.trim()) return;

    // Check duplicate code (if adding new)
    if (!initial) {
      const isDuplicate = existingCodes.some(
        (code) => code.toLowerCase() === docCode.trim().toLowerCase()
      );
      if (isDuplicate) {
        setError("Mã tài liệu này đã tồn tại trên hệ thống!");
        return;
      }
    }

    onSubmit({
      docCode: docCode.trim(),
      docName: docName.trim(),
      docType: docType.trim(),
      currentRev: currentRev.trim(),
      issueDate: issueDate,
      customer: customer.trim() || undefined,
      aspPn: aspPn.trim() || undefined,
    });
    onOpenChange(false);
  };

  const isValid = docCode.trim() && docName.trim() && currentRev.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {initial ? "Chỉnh sửa tài liệu" : "Thêm mới tài liệu"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 p-2.5 rounded-md">
              {error}
            </p>
          )}

          {/* Mã tài liệu */}
          <div className="space-y-1.5">
            <Label htmlFor="docCode">Mã tài liệu <span className="text-destructive">*</span></Label>
            <Input
              id="docCode"
              value={docCode}
              onChange={(e) => {
                setDocCode(e.target.value);
                setError("");
              }}
              placeholder="Ví dụ: EN-WI1124"
              disabled={!!initial}
              autoComplete="off"
            />
          </div>

          {/* Tên tài liệu */}
          <div className="space-y-1.5">
            <Label htmlFor="docName">Tên tài liệu <span className="text-destructive">*</span></Label>
            <Input
              id="docName"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Ví dụ: P011534_A"
              autoComplete="off"
            />
          </div>

          {/* Loại tài liệu */}
          <div className="space-y-1.5">
            <Label htmlFor="docType">Loại tài liệu</Label>
            <Input
              id="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="Ví dụ: WI, SOP, Bản gốc, Bản sao..."
              autoComplete="off"
            />
          </div>

          {/* Phiên bản (Rev) */}
          <div className="space-y-1.5">
            <Label htmlFor="currentRev">Phiên bản hiện hành (Rev) <span className="text-destructive">*</span></Label>
            <Input
              id="currentRev"
              value={currentRev}
              onChange={(e) => setCurrentRev(e.target.value)}
              placeholder="Ví dụ: 00, 01, A, A1..."
              autoComplete="off"
            />
          </div>

          {/* Ngày ban hành */}
          <div className="space-y-1.5">
            <Label htmlFor="issueDate">Ngày ban hành</Label>
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>

          {/* Khách hàng (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="customer">Khách hàng (Không bắt buộc)</Label>
            <Input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Ví dụ: ASP..."
              autoComplete="off"
            />
          </div>

          {/* ASP P/N (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="aspPn">ASP P/N (Không bắt buộc)</Label>
            <Input
              id="aspPn"
              value={aspPn}
              onChange={(e) => setAspPn(e.target.value)}
              placeholder="Ví dụ: P011534..."
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="success" disabled={!isValid} onClick={handleConfirm}>
            {initial ? "Lưu thay đổi" : "Thêm mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
