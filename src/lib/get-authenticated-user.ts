import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getAuthenticatedUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    const dbUser = await prisma.usuario.findUnique({
        where: { id: user.id },
        select: { id: true, nombre: true, email: true, rol: true },
    });

    if (!dbUser) return null;

    return {
        id: dbUser.id,
        name: dbUser.nombre,
        email: dbUser.email,
        role: dbUser.rol,
    };
});