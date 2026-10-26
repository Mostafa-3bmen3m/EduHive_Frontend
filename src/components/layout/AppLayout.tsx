"use client";

import Sidebar from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/";

    if (isAuthPage) {
        return <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">{children}</main>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
