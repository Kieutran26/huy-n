import { useCallback, useSyncExternalStore } from "react";
import type { Employee } from "@/types";
import { KEYS } from "@/lib/storage";
import { getSnapshot, subscribe, writeStore } from "@/lib/store";
import { genId } from "@/lib/utils";

export function useEmployees() {
  const employees = useSyncExternalStore(
    (cb) => subscribe(KEYS.EMPLOYEES, cb),
    () => getSnapshot<Employee>(KEYS.EMPLOYEES)
  );

  const addEmployee = useCallback(
    (data: Omit<Employee, "id" | "createdAt">) => {
      const emp: Employee = {
        ...data,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      writeStore(KEYS.EMPLOYEES, [...getSnapshot<Employee>(KEYS.EMPLOYEES), emp]);
      return emp;
    },
    []
  );

  const updateEmployee = useCallback((emp: Employee) => {
    const list = getSnapshot<Employee>(KEYS.EMPLOYEES).map((e) =>
      e.id === emp.id ? emp : e
    );
    writeStore(KEYS.EMPLOYEES, list);
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    writeStore(
      KEYS.EMPLOYEES,
      getSnapshot<Employee>(KEYS.EMPLOYEES).filter((e) => e.id !== id)
    );
  }, []);

  return { employees, addEmployee, updateEmployee, deleteEmployee };
}
