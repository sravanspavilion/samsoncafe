"use client";
import { useState, useMemo } from "react";
import { Calendar, Filter, Download, CreditCard, Landmark, DollarSign, Wallet, TrendingUp, Users, ArrowDown, ArrowUp, Minus, Search, Smartphone } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { DataTable, StatCard, StatusBadge, TableSkeleton } from "@/components/admin/AdminComponents";
import { usePayments, type Payment } from "@/lib/api-admin";
import { Toaster, toast } from "sonner";

const paymentMethods = ["All", "UPI", "Card", "Cash", "Roots Pay"] as const;
const paymentStatuses = ["All", "completed", "pending", "failed", "refunded"] as const;

export default function AdminPaymentsPage() {
  const { data: paymentsData, isLoading, error, mutate, retry } = usePayments();

  // Ensure payments is always an array
  const payments = paymentsData || [];

  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment: Payment) => {
      const matchesSearch = searchQuery === "" ||
        payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.method.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod = methodFilter === "All" || payment.method === methodFilter;
      const matchesStatus = statusFilter === "All" || payment.status === statusFilter;

      // Date filtering would need date parsing - simplified for now
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [payments, searchQuery, methodFilter, statusFilter]);

  // Daily summary calculations
  const today = new Date().toISOString().split("T")[0];
  const todayPayments = payments.filter(p => p.date.startsWith(today) && p.status === "completed");
  const totalRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const transactionCount = todayPayments.length;
  const avgTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  const methodBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; amount: number }> = {};
    todayPayments.forEach(p => {
      if (!breakdown[p.method]) breakdown[p.method] = { count: 0, amount: 0 };
      breakdown[p.method].count++;
      breakdown[p.method].amount += p.amount;
    });
    return breakdown;
  }, [payments, today]); // Use stable dependencies

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "UPI": return <Smartphone size={16} />;
      case "Card": return <CreditCard size={16} />;
      case "Cash": return <Landmark size={16} />;
      case "Roots Pay": return <Wallet size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "available";
      case "pending": return "preparing";
      case "failed": return "out-of-stock";
      case "refunded": return "low-stock";
      default: return "available";
    }
  };

  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Order ID", "Date", "Method", "Amount", "Status", "Details"];
    const rows = filteredPayments.map(p => [
      p.transactionId,
      p.orderId,
      p.date,
      p.method,
      p.amount.toString(),
      p.status,
      p.details || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `samsons-payments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold tracking-[.22em] uppercase text-[var(--primary)]">RECONCILIATION</span>
          <h1 className="serif mt-2 text-3xl font-semibold text-[var(--on-surface)]">Payments</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCard key={i} label="Loading..." value="—" />)}
        </div>
        <div className="admin-card p-4">
          <TableSkeleton rows={8} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[.22em] uppercase text-[var(--primary)]">RECONCILIATION & TENDERS</span>
          <h1 className="serif mt-2 text-3xl font-semibold text-[var(--on-surface)]">Payments</h1>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">Transaction ledger • Daily settlement overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportCSV} className="btn-ghost flex items-center gap-2">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => mutate()} className="btn-ghost flex items-center gap-2">
            <ArrowDown size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatINR(totalRevenue)}
          note={`${transactionCount} transactions`}
          icon={<TrendingUp size={18} className="text-[var(--primary)]" />}
          highlight
        />
        <StatCard
          label="Transactions"
          value={transactionCount}
          note="Completed payments today"
          icon={<Users size={18} className="text-[var(--secondary)]" />}
        />
        <StatCard
          label="Avg. Ticket"
          value={formatINR(Math.round(avgTicket))}
          note="Per transaction"
          icon={<DollarSign size={18} className="text-[var(--success)]" />}
        />
        <StatCard
          label="Methods Active"
          value={Object.keys(methodBreakdown).length}
          note={Object.entries(methodBreakdown).map(([k, v]) => `${k}: ${v.count}`).join(", ")}
          icon={<Wallet size={18} className="text-[var(--cold-badge)]" />}
        />
      </div>

      {/* Method Breakdown */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--secondary)]">Tender Mix</span>
            <h2 className="serif mt-1 text-xl font-semibold text-[var(--on-surface)]">Payment Method Breakdown (Today)</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(methodBreakdown).map(([method, data]) => (
            <div key={method} className="bg-[var(--surface-container)] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)]">
                  {getMethodIcon(method)}
                </div>
                <div>
                  <p className="font-medium text-[var(--on-surface)]">{method}</p>
                  <p className="text-xs text-[var(--on-surface-variant)]">{data.count} transactions</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--on-surface-variant)]">Volume</span>
                  <span className="font-medium text-[var(--on-surface)]">{data.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--on-surface-variant)]">Amount</span>
                  <span className="font-medium text-[var(--primary)]">{formatINR(data.amount)}</span>
                </div>
                <div className="h-1.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                    style={{ width: `${(data.amount / totalRevenue) * 100 || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="admin-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transaction ID, order ID..."
            className="input-luxury w-full pl-10 pr-4 py-2.5"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--on-surface-variant)]">Method:</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
              className="input-luxury w-auto py-1.5 px-3 text-sm"
            >
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--on-surface-variant)]">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input-luxury w-auto py-1.5 px-3 text-sm"
            >
              {paymentStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--on-surface-variant)]">Date:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="input-luxury w-auto py-1.5 px-3 text-sm"
            />
            <span className="text-[var(--on-surface-variant)]">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="input-luxury w-auto py-1.5 px-3 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-bold text-[10px] uppercase tracking-wider">
                <th className="table-header">Transaction ID</th>
                <th className="table-header">Order ID</th>
                <th className="table-header">Date & Time</th>
                <th className="table-header">Method</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline-variant)] text-[var(--on-surface)]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--on-surface-variant)]">No transactions match your filters</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.transactionId} className="hover:bg-[var(--surface-container-low)] transition-colors">
                    <td className="table-cell font-mono text-sm text-[var(--secondary)]">{payment.transactionId}</td>
                    <td className="table-cell font-mono text-sm">{payment.orderId}</td>
                    <td className="table-cell text-sm">{payment.date}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)]">
                          {getMethodIcon(payment.method)}
                        </span>
                        <span className="font-medium">{payment.method}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right font-headline-sm text-[var(--on-surface)]">{formatINR(payment.amount)}</td>
                    <td className="table-cell text-center">
                      <StatusBadge status={payment.status} variant={getStatusVariant(payment.status)} size="md" />
                    </td>
                    <td className="table-cell text-sm text-[var(--on-surface-variant)]">{payment.details || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="px-4 py-3 bg-[var(--surface-container-low)] border-t border-[var(--outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--on-surface-variant)]">
          <span>Showing {filteredPayments.length} of {payments.length} transactions</span>
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-3 py-1.5 text-xs" disabled>Previous</button>
            <button className="btn-ghost px-3 py-1.5 text-xs" disabled>Next</button>
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}