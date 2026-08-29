import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedUser() {
    const supabase = await createClient();

    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (!userId) return null;

    const dbUser = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, nombre: true, email: true, rol: true },
    });

    if (!dbUser) return null;

    return {
        id: dbUser.id,
        name: dbUser.nombre,
        email: dbUser.email,
        role: dbUser.rol,
    };
}