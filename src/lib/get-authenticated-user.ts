import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const dbUser = await prisma.usuario.findUnique({
        where: { id: user.id },
        select: { nombre: true, email: true, rol: true },
    });

    if (!dbUser) redirect("/auth/login");

    return {
        name: dbUser.nombre,
        email: dbUser.email,
        role: dbUser.rol,
    };
}