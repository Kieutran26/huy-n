import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import type { Employee } from "@/types";
import { useEmployees } from "@/hooks/useEmployees";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import {
  EmployeeForm,
  type EmployeeFormValues,
} from "@/components/employees/EmployeeForm";
import { EmployeeTable } from "@/components/employees/EmployeeTable";

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } =
    useEmployees();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [toDelete, setToDelete] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.employeeId.toLowerCase().includes(q) ||
        e.fullName.toLowerCase().includes(q) ||
        e.dept.toLowerCase().includes(q)
    );
  }, [employees, search]);

  function handleSubmit(values: EmployeeFormValues) {
    if (editing) {
      updateEmployee({ ...editing, ...values });
      toast.success("Đã cập nhật nhân viên");
    } else {
      if (
        employees.some(
          (e) =>
            e.employeeId.toLowerCase() === values.employeeId.toLowerCase()
        )
      ) {
        toast.warning("MSNV đã tồn tại", values.employeeId);
        return;
      }
      addEmployee(values);
      toast.success("Đã thêm nhân viên");
    }
  }

  function confirmDelete() {
    if (!toDelete) return;
    deleteEmployee(toDelete.id);
    toast.success("Đã xóa nhân viên");
    setToDelete(null);
  }

  return (
    <>
      <PageHeader
        title="Nhân viên"
        breadcrumb="Document Control / Nhân viên"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Tìm theo MSNV, tên, bộ phận..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Chưa có nhân viên"
          description="Thêm nhân viên thủ công hoặc import file Excel ở trang Tài liệu để tự tạo nhân viên."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Thêm nhân viên
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Không tìm thấy nhân viên"
          description="Thử từ khóa khác."
        />
      ) : (
        <EmployeeTable
          employees={filtered}
          onEdit={(emp) => {
            setEditing(emp);
            setFormOpen(true);
          }}
          onDelete={(emp) => setToDelete(emp)}
        />
      )}

      <EmployeeForm
        open={formOpen}
        initial={editing}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Xóa nhân viên?"
        description={
          toDelete
            ? `Bạn chắc chắn muốn xóa ${toDelete.fullName} (${toDelete.employeeId})?`
            : ""
        }
        confirmText="Xóa"
        destructive
        onConfirm={confirmDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      />
    </>
  );
}
