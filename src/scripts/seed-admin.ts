import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

async function main() {
    const email = "admin@empresa.com";
    const password = "CambiaEstaPassword123!";
    const nombreUsuario = "Admin";

    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (error || !authUser.user) { throw new Error(`Error creando usuario en Supabase Auth: ${error?.message}`); }

    await prisma.usuario.create({
        data: {
            id: authUser.user.id,
            email,
            nombre: nombreUsuario,
            rol: "admin",
        },
    });

    console.log(`Admin creado: ${email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })

    .finally(async () => { await prisma.$disconnect(); });