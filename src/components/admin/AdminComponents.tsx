"use client";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  note?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  highlight?: boolean;
}

export function StatCard({ label, value, note, icon, trend, highlight }: StatCardProps) {
  return (
    <div className={cn("stat-card admin-card-hover", highlight && "border-[var(--primary)]/50")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold tracking-[.16em] uppercase text-[var(--on-surface-variant)]">{label}</p>
          {icon && <span className="text-[var(--primary)]">{icon}</span>}
        </div>
        {highlight && <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />}
      </div>
      <p className="serif mt-3 text-3xl font-semibold text-[var(--on-surface)]">{value}</p>
      {note && <p className="mt-2 text-xs text-[var(--on-surface-variant)]">{note}</p>}
      {trend && (
        <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trend.positive ? "text-[var(--success)]" : "text-[var(--error)]")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: "available" | "low-stock" | "out-of-stock" | "preparing" | "ready" | "new" | "completed" | "cancelled" | "rejected";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; dotColor: string }> = {
  available: { bg: "rgba(138,154,91,0.15)", text: "var(--success)", border: "rgba(138,154,91,0.4)", label: "Available", dotColor: "var(--success)" },
  "low-stock": { bg: "rgba(212,175,55,0.2)", text: "var(--warning)", border: "rgba(212,175,55,0.4)", label: "Low Stock", dotColor: "var(--warning)" },
  "out-of-stock": { bg: "rgba(255,180,171,0.2)", text: "var(--error)", border: "rgba(255,180,171,0.4)", label: "Out of Stock", dotColor: "var(--error)" },
  preparing: { bg: "rgba(78,122,138,0.2)", text: "var(--cold-badge)", border: "rgba(78,122,138,0.4)", label: "Preparing", dotColor: "var(--cold-badge)" },
  ready: { bg: "rgba(138,154,91,0.15)", text: "var(--success)", border: "rgba(138,154,91,0.4)", label: "Ready", dotColor: "var(--success)" },
  new: { bg: "rgba(233,195,73,0.2)", text: "var(--primary)", border: "rgba(233,195,73,0.4)", label: "New", dotColor: "var(--primary)" },
  completed: { bg: "var(--surface-container-highest)", text: "var(--on-surface-variant)", border: "var(--outline-variant)", label: "Completed", dotColor: "var(--on-surface-variant)" },
  cancelled: { bg: "rgba(255,180,171,0.2)", text: "var(--error)", border: "rgba(255,180,171,0.4)", label: "Cancelled", dotColor: "var(--error)" },
  rejected: { bg: "rgba(255,180,171,0.2)", text: "var(--error)", border: "rgba(255,180,171,0.4)", label: "Rejected", dotColor: "var(--error)" },
};

export function StatusBadge({ status, variant, size = "md", dot = true }: StatusBadgeProps) {
  const key = variant || status.toLowerCase().replace(/\s+/g, "-");
  const config = statusConfig[key] || statusConfig.available;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider border",
        sizeClasses[size],
        `bg-[${config.bg}] text-[${config.text}] border-[${config.border}]`
      )}
    >
      {dot && <span className={cn("rounded-full", { "w-1.5 h-1.5": size !== "lg", "w-2 h-2": size === "lg" }, `bg-[${config.dotColor}]`)} />}
      {config.label}
    </span>
  );
}

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Stepper({ value, min = 0, max = 999, onChange, disabled, size = "md" }: StepperProps) {
  const sizeClasses = {
    sm: "w-7 h-7 text-[14px]",
    md: "w-8 h-8 text-[16px]",
  };
  const displaySize = { sm: "w-10", md: "w-12" };

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={cn(
          "rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center",
          sizeClasses[size]
        )}
        aria-label="Decrease"
      >
        −
      </button>
      <span className={cn("text-center font-headline-sm text-[var(--on-surface)]", displaySize[size])}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={cn(
          "rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center",
          sizeClasses[size]
        )}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ headers, children, className }: DataTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-[var(--outline-variant)]", className)}>
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-[var(--surface-container-high)]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="table-header">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--outline-variant)] text-[var(--on-surface)]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--surface-container-high)] rounded",
        className
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr>
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="table-cell">
          <Skeleton className="h-4 w-20" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--outline-variant)]">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-[var(--surface-container-high)]">
          <tr>
            {[...Array(cols)].map((_, i) => (
              <th key={i} className="table-header">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--outline-variant)]">
          {[...Array(rows)].map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}