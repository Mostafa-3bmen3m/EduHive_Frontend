"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, FileText, Youtube, Target, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const SidebarItem = ({
    href,
    icon: Icon,
    label,
}: {
    href: string;
    icon: any;
    label: string;
}) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} className="w-full">
            <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive && "bg-zinc-200 dark:bg-zinc-800")}
            >
                <Icon className="mr-2 h-4 w-4" />
                {label}
            </Button>
        </Link>
    );
};

export default function Sidebar() {
    const logout = useAuthStore((state) => state.logout);
    const router = useRouter();

    const handleLogout = () => {
        logout();
        Cookies.remove("token");
        router.push('/login');
    }

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-zinc-50/40 dark:bg-zinc-900/40">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    EduHive
                </h1>
            </div>
            <div className="flex-1 space-y-2 p-4">
                <SidebarItem href="/dashboard" icon={Home} label="Dashboard" />
                <SidebarItem href="/resources" icon={FileText} label="Resources" />
                <SidebarItem href="/videos" icon={Youtube} label="Videos" />
                <SidebarItem href="/schedule" icon={Target} label="AI Scheduler" />
            </div>
            <div className="p-4 flex items-center justify-between gap-2">
                <Button variant="ghost" className="flex-1 justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
                <div className="flex-none">
                    <ModeToggle />
                </div>
            </div>
        </div>
    );
}
