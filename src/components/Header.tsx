"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Route meta ── */
const routeMeta: Record<string, { label: string; parent?: string }> = {
    "/dashboard":                { label: "Dashboard" },
    "/dashboard/leads":          { label: "Leads",           parent: "Dashboard" },
    "/dashboard/email-outreach": { label: "Emails",          parent: "Dashboard" },
    "/dashboard/settings":       { label: "Einstellungen",   parent: "Dashboard" },
};

function NotificationDropdown() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-foreground/55 hover:text-foreground"
                >
                    <Bell className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-72 p-0 shadow-xl overflow-hidden"
            >
                <DropdownMenuLabel className="px-4 py-3 border-b border-border/50 text-sm font-bold">
                    Benachrichtigungen
                </DropdownMenuLabel>
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Keine Benachrichtigungen</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Du bist auf dem neuesten Stand.</p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ── Header ── */
export function Header() {
    const pathname = usePathname();
    const meta = routeMeta[pathname];

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <SidebarTrigger className="-ml-1" />

                <Separator orientation="vertical" className="h-4" />

                {meta && (
                    <Breadcrumb>
                        <BreadcrumbList>
                            {meta.parent && (
                                <>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard" className="text-sm">
                                            {meta.parent}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block">
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </BreadcrumbSeparator>
                                </>
                            )}
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-sm font-semibold">
                                    {meta.label}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>

            <div className="flex items-center gap-1">
                <NotificationDropdown />
            </div>
        </header>
    );
}
