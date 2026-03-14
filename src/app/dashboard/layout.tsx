import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/profiles";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const [role, cookieStore] = await Promise.all([
        getUserRole(user.id),
        cookies(),
    ]);

    const sidebarUser = {
        email: user.email ?? "",
        name: (user.user_metadata?.full_name as string | null)
            ?? (user.user_metadata?.name as string | null)
            ?? null,
    };

    const sidebarCookie = cookieStore.get("sidebar_state");
    const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : true;

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar user={sidebarUser} role={role} />
            <SidebarInset className="bg-background">
                <Header />
                <div className="flex flex-1 flex-col">
                    <main className="@container/main flex flex-1 flex-col overflow-y-auto">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
