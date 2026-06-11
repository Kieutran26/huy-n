import * as React from "react";

interface PageHeaderProps {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {breadcrumb ?? "Document Control"}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-foreground">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
