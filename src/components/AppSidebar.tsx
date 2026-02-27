"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, Users, Mail,
    Settings, ChevronsUpDown,
    LogOut, BadgeCheck, Bell, Loader2,
} from "lucide-react";
import { useState } from "react";

import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
    SidebarHeader, SidebarMenu,
    SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
    DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

/* ── Navigation data ── */
const mainNav = [
    { name: "Dashboard",  href: "/dashboard",                icon: LayoutDashboard },
    { name: "Leads",      href: "/dashboard/leads",          icon: Users           },
    { name: "Emails",     href: "/dashboard/email-outreach", icon: Mail            },
];

const systemNav = [
    { name: "Einstellungen", href: "/dashboard/settings", icon: Settings },
];

/* ── Helpers ── */
function getInitials(name: string | null | undefined, email: string): string {
    if (name && name.trim()) {
        const parts = name.trim().split(" ");
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0][0].toUpperCase();
    }
    return email[0].toUpperCase();
}

function getDisplayName(name: string | null | undefined, email: string): string {
    if (name && name.trim()) return name.trim().split(" ")[0];
    return email.split("@")[0];
}

/* ── Props ── */
interface AppSidebarProps {
    user: {
        email: string;
        name?: string | null;
    };
}

/* ── App Sidebar ── */
export function AppSidebar({ user }: AppSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const initials = getInitials(user.name, user.email);
    const displayName = getDisplayName(user.name, user.email);

    async function handleLogout() {
        setLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-sidebar-border"
        >
            {/* ── Header / Logo ── */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-transparent active:bg-transparent"
                        >
                            <Link href="/dashboard" className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-white/20 flex items-center justify-center">
                                    <Image
                                        src="/images/KI-Kanzlei_Logo_2026.png"
                                        alt="KI Kanzlei"
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 object-cover rounded-full"
                                        priority
                                    />
                                </div>
                                <span className="text-sm font-bold text-white tracking-tight group-data-[collapsible=icon]:hidden">
                                    KI Kanzlei
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ── Content ── */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-wider font-semibold">
                        Module
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNav.map(({ name, href, icon: Icon }) => (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === href}
                                        tooltip={name}
                                        className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-white/15 data-[active=true]:text-white data-[active=true]:font-semibold"
                                    >
                                        <Link href={href}>
                                            <Icon className="shrink-0" />
                                            <span>{name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-wider font-semibold">
                        System
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {systemNav.map(({ name, href, icon: Icon }) => (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === href}
                                        tooltip={name}
                                        className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-white/15 data-[active=true]:text-white data-[active=true]:font-semibold"
                                    >
                                        <Link href={href}>
                                            <Icon className="shrink-0" />
                                            <span>{name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ── Footer / User ── */}
            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    tooltip="Mein Konto"
                                >
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold text-white">{displayName}</span>
                                        <span className="truncate text-[11px] text-sidebar-foreground/50">{user.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto h-4 w-4 text-sidebar-foreground/40" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                side="top"
                                align="end"
                                sideOffset={8}
                                className="w-60 p-0 shadow-xl overflow-hidden"
                            >
                                {/* User info */}
                                <DropdownMenuLabel className="px-4 py-3.5 border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 flex-shrink-0">
                                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground">{displayName}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                            <Badge variant="secondary" className="mt-1 text-[9px] font-semibold uppercase tracking-wide">
                                                Administrator
                                            </Badge>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuGroup className="py-1.5">
                                    <DropdownMenuItem className="mx-1.5 gap-3 cursor-pointer">
                                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                                        Mein Profil
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="mx-1.5 gap-3 cursor-pointer">
                                        <Link href="/dashboard/settings">
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                            Einstellungen
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="mx-1.5 gap-3 cursor-pointer">
                                        <Bell className="h-4 w-4 text-muted-foreground" />
                                        Benachrichtigungen
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                <DropdownMenuGroup className="py-1.5">
                                    <DropdownMenuItem
                                        variant="destructive"
                                        className="mx-1.5 gap-3 cursor-pointer"
                                        onSelect={handleLogout}
                                        disabled={loggingOut}
                                    >
                                        {loggingOut
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <LogOut className="h-4 w-4" />
                                        }
                                        {loggingOut ? "Abmelden…" : "Abmelden"}
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
