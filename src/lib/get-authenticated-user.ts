import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const dbUser = await prisma.usuario.findUnique({
        where: { id: user.id },
        select: { nombre: true, email: true, rol: true },
    });

    if (!dbUser) return null;

    return {
        name: dbUser.nombre,
        email: dbUser.email,
        role: dbUser.rol,
    };
}