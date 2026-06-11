import { useEffect, useState } from "react";
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
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { todayISO } from "@/lib/utils";

export interface DistributionFormValues {
  docCode: string;
  docName: string;
  rev: string;
  employeeId: string;
  dept: string;
  fullName: string;
  distributionDate: string;
  docType: string;
  detail: string;
  quantity: string;
  recalled: boolean;
  recalledDate: string | null;
}

interface DistributionFormModalProps {
  open: boolean;
  initial: Distribution | null;
  documents: Document[];
  employees: Employee[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DistributionFormValues) => void;
}

export function DistributionFormModal({
  open,
  initial,
  documents,
  employees,
  onOpenChange,
  onSubmit,
}: DistributionFormModalProps) {
  const [docCode, setDocCode] = useState("");
  const [docName, setDocName] = useState("");
  const [rev, setRev] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [dept, setDept] = useState("");
  const [fullName, setFullName] = useState("");
  const [distributionDate, setDistributionDate] = useState("");
  const [docType, setDocType] = useState("Bản gốc");
  const [detail, setDetail] = useState("");
  const [quantity, setQuantity] = useState("N/A");
  const [recalled, setRecalled] = useState(false);
  const [recalledDate, setRecalledDate] = useState<string | null>(null);

  // Sync when modal opens or initial values change
  useEffect(() => {
    if (open) {
      if (initial) {
        setDocCode(initial.docCode);
        setDocName(initial.docName);
        setRev(initial.rev);
        setEmployeeId(initial.employeeId);
        setDept(initial.dept);
        setFullName(initial.fullName);
        setDistributionDate(initial.distributionDate);
        setDocType(initial.docType || "Bản gốc");
        setDetail(initial.detail || "");
        setQuantity(initial.quantity || "N/A");
        setRecalled(initial.recalled);
        setRecalledDate(initial.recalledDate);
      } else {
        setDocCode("");
        setDocName("");
        setRev("");
        setEmployeeId("");
        setDept("");
        setFullName("");
        setDistributionDate(todayISO());
        setDocType("Bản gốc");
        setDetail("");
        setQuantity("N/A");
        setRecalled(false);
        setRecalledDate(null);
      }
    }
  }, [open, initial]);

  // Auto-fill document info when docCode is selected
  const handleDocCodeChange = (code: string) => {
    setDocCode(code);
    const doc = documents.find((d) => d.docCode === code);
    if (doc) {
      setDocName(doc.docName);
      setRev(doc.currentRev);
    }
  };

  // Auto-fill employee info when employeeId is selected
  const handleEmployeeIdChange = (id: string) => {
    setEmployeeId(id);
    const emp = employees.find((e) => e.employeeId === id);
    if (emp) {
      setFullName(emp.fullName);
      setDept(emp.dept);
    }
  };

  const handleDocTypeChange = (type: string) => {
    setDocType(type);
    if (type === "Bản gốc") {
      setQuantity("N/A");
    } else if (quantity === "N/A") {
      setQuantity("1");
    }
  };

  const handleRecalledChange = (checked: boolean) => {
    setRecalled(checked);
    if (checked) {
      setRecalledDate(todayISO());
    } else {
      setRecalledDate(null);
    }
  };

  const handleConfirm = () => {
    if (!docCode || !employeeId || !rev) return;
    onSubmit({
      docCode,
      docName,
      rev,
      employeeId,
      dept,
      fullName,
      distributionDate,
      docType,
      detail,
      quantity,
      recalled,
      recalledDate,
    });
    onOpenChange(false);
  };

  const isFormValid = docCode && employeeId && rev;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {initial ? "Chỉnh sửa bản phân phát" : "Thêm mới bản phân phát"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          {/* Mã tài liệu */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-code">Mã tài liệu <span className="text-destructive">*</span></Label>
            <Select
              id="doc-code"
              value={docCode}
              onChange={(e) => handleDocCodeChange(e.target.value)}
              disabled={!!initial}
            >
              <option value="">-- Chọn tài liệu --</option>
              {documents.map((d) => (
                <option key={d.id} value={d.docCode}>
                  {d.docCode} ({d.docName})
                </option>
              ))}
            </Select>
          </div>

          {/* Tên tài liệu (Read-only hoặc điền tự động) */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-name">Tên tài liệu</Label>
            <Input
              id="doc-name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Tên tài liệu..."
              disabled
            />
          </div>

          {/* Phiên bản (Rev) */}
          <div className="space-y-1.5">
            <Label htmlFor="rev">Phiên bản (Rev) <span className="text-destructive">*</span></Label>
            <Input
              id="rev"
              value={rev}
              onChange={(e) => setRev(e.target.value)}
              placeholder="00, A, A1..."
            />
          </div>

          {/* Ngày phân phát */}
          <div className="space-y-1.5">
            <Label htmlFor="dist-date">Ngày phân phát</Label>
            <Input
              id="dist-date"
              type="date"
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
            />
          </div>

          {/* Người nhận (MSNV) */}
          <div className="space-y-1.5">
            <Label htmlFor="emp-id">MSNV người nhận <span className="text-destructive">*</span></Label>
            <Select
              id="emp-id"
              value={employeeId}
              onChange={(e) => handleEmployeeIdChange(e.target.value)}
              disabled={!!initial}
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.employeeId}>
                  {e.employeeId} — {e.fullName}
                </option>
              ))}
            </Select>
          </div>

          {/* Bộ phận */}
          <div className="space-y-1.5">
            <Label htmlFor="dept">Bộ phận</Label>
            <Input
              id="dept"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              disabled
            />
          </div>

          {/* Họ tên */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="full-name">Họ tên nhân viên</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled
            />
          </div>

          {/* Phân loại tài liệu */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-type">Phân loại phân phát</Label>
            <Select
              id="doc-type"
              value={docType}
              onChange={(e) => handleDocTypeChange(e.target.value)}
            >
              <option value="Bản gốc">Bản gốc</option>
              <option value="Bản sao">Bản sao</option>
            </Select>
          </div>

          {/* Số lượng */}
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Số lượng</Label>
            <Input
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="N/A, 1, 2, 5..."
              disabled={docType === "Bản gốc"}
            />
          </div>

          {/* Chi tiết (Trang photo) */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="detail">Chi tiết (Ví dụ: Trang 5, Bảng phân dây...)</Label>
            <Input
              id="detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Mặc định trống (Phân phát tất cả) hoặc ghi chú trang cụ thể..."
            />
          </div>

          {/* Trạng thái thu hồi */}
          <div className="flex items-center gap-2 pt-2 sm:col-span-2">
            <Checkbox
              id="recalled"
              checked={recalled}
              onChange={handleRecalledChange}
            />
            <Label htmlFor="recalled" className="cursor-pointer font-medium text-amber-700">
              Đã thu hồi phiên bản này
            </Label>
          </div>

          {/* Ngày thu hồi */}
          {recalled && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="recalled-date">Ngày thu hồi</Label>
              <Input
                id="recalled-date"
                type="date"
                value={recalledDate || ""}
                onChange={(e) => setRecalledDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="success"
            disabled={!isFormValid}
            onClick={handleConfirm}
          >
            {initial ? "Lưu thay đổi" : "Thêm mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
