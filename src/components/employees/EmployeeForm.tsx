import { useEffect, useState } from "react";
import type { Employee } from "@/types";
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

export type EmployeeFormValues = Omit<Employee, "id" | "createdAt">;

interface EmployeeFormProps {
  open: boolean;
  initial?: Employee | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EmployeeFormValues) => void;
}

const empty: EmployeeFormValues = {
  employeeId: "",
  fullName: "",
  dept: "",
  email: "",
};

export function EmployeeForm({
  open,
  initial,
  onOpenChange,
  onSubmit,
}: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              employeeId: initial.employeeId,
              fullName: initial.fullName,
              dept: initial.dept,
              email: initial.email,
            }
          : empty
      );
      setError("");
    }
  }, [open, initial]);

  function set<K extends keyof EmployeeFormValues>(
    key: K,
    val: EmployeeFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function handleSubmit() {
    if (!values.employeeId.trim() || !values.fullName.trim() || !values.dept.trim()) {
      setError("Vui lòng nhập đầy đủ MSNV, Họ tên và Bộ phận.");
      return;
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError("Email không hợp lệ.");
      return;
    }
    onSubmit({
      employeeId: values.employeeId.trim(),
      fullName: values.fullName.trim(),
      dept: values.dept.trim(),
      email: values.email.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {initial ? "Sửa nhân viên" : "Thêm nhân viên"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-id">
              MSNV <span className="text-destructive">*</span>
            </Label>
            <Input
              id="emp-id"
              value={values.employeeId}
              onChange={(e) => set("employeeId", e.target.value)}
              placeholder="ASP0684"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-name">
              Họ tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="emp-name"
              value={values.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-dept">
              Bộ phận <span className="text-destructive">*</span>
            </Label>
            <Input
              id="emp-dept"
              value={values.dept}
              onChange={(e) => set("dept", e.target.value)}
              placeholder="PD"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@company.com (không bắt buộc)"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>{initial ? "Lưu" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
