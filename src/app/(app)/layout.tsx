import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import MenuLayoutClient from "@/components/layout/menuLayoutClient";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const appUser = await getAuthenticatedUser();

    if (!appUser) {
        redirect("/auth/login");
    }

    const cookieStore = await cookies();
    const sidebarCookie = cookieStore.get("sidebar_expanded");
    const initialExpanded = sidebarCookie?.value !== "false";

    return (
        <MenuLayoutClient user={appUser} initialExpanded={initialExpanded}>
            {children}
        </MenuLayoutClient>
    );
}