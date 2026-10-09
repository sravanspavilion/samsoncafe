import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AdminTopbar />
      <div className="md:flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-4 md:p-8 lg:p-10 pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}