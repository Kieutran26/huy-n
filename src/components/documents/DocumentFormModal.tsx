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
    if (!docCode.trim() || !docName.trim() || !currentRev.trim() || !customer.trim()) return;
 
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
      customer: customer.trim(),
      aspPn: docName.trim(),
    });
    onOpenChange(false);
  };
 
  const isValid = docCode.trim() && docName.trim() && currentRev.trim() && customer.trim();

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

          {/* Khách hàng */}
          <div className="space-y-1.5">
            <Label htmlFor="customer">Khách hàng <span className="text-destructive">*</span></Label>
            <Input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Ví dụ: HB01, KN01..."
              autoComplete="off"
            />
          </div>

          {/* Số sơ đồ */}
          <div className="space-y-1.5">
            <Label htmlFor="docCode">Số sơ đồ (Mã TL) <span className="text-destructive">*</span></Label>
            <Input
              id="docCode"
              value={docCode}
              onChange={(e) => {
                setDocCode(e.target.value);
                setError("");
              }}
              placeholder="Ví dụ: EN-WI1120"
              disabled={!!initial}
              autoComplete="off"
            />
          </div>

          {/* Mã ASP */}
          <div className="space-y-1.5">
            <Label htmlFor="docName">Mã ASP (Tên TL) <span className="text-destructive">*</span></Label>
            <Input
              id="docName"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Ví dụ: P011471_D"
              autoComplete="off"
            />
          </div>

          {/* Phiên bản (Rev) */}
          <div className="space-y-1.5">
            <Label htmlFor="currentRev">Phiên bản (Rev.) <span className="text-destructive">*</span></Label>
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
