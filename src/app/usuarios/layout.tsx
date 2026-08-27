import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import MenuLayoutClient from "@/components/layout/menuLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const dbUser = await prisma.usuario.findUnique({
        where: { id: user.id },
        select: { nombre: true, email: true, rol: true },
    });

    if (!dbUser) redirect("/auth/login");

    const appUser = {
        name: dbUser.nombre,
        email: dbUser.email,
        role: dbUser.rol,
    };

    const cookieStore = await cookies();
    const sidebarCookie = cookieStore.get("sidebar_expanded");
    const initialExpanded = sidebarCookie?.value !== "false";

    return (
        <MenuLayoutClient user={appUser} initialExpanded={initialExpanded}>
            {children}
        </MenuLayoutClient>
    );
}