import { AdminSidebar } from "@/components/admin/AdminSidebar";
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#0b0908] md:flex"><AdminSidebar /><main className="min-w-0 flex-1 p-5 md:p-9">{children}</main></div>; }
