import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

export async function GET() {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
            },
            orderBy: {
                nombre: "asc",
            },
        });

        return NextResponse.json(usuarios, { status: 200 });

    } catch (error: unknown) {
        console.error("Error al obtener los usuarios:", error);
        const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getAuthenticatedUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 }
            );
        }

        if (currentUser.role !== "admin") {
            return NextResponse.json(
                { error: "Acceso denegado. Se requieren permisos de administrador." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            name,
            email,
            password,
            role
        } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios (nombre, email, contraseña)." },
                { status: 400 }
            );
        }

        const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error || !authUser.user) {
            return NextResponse.json(
                { error: error?.message || "Error creando usuario en Supabase Auth" },
                { status: 400 }
            );
        }

        const newDbUser = await prisma.usuario.create({
            data: {
                id: authUser.user.id,
                email,
                nombre: name,
                rol: role || "user",
            },
        });

        return NextResponse.json(
            {
                message: "Usuario creado exitosamente",
                user: {
                    id: newDbUser.id,
                    name: newDbUser.nombre,
                    email: newDbUser.email,
                    role: newDbUser.rol
                }
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Error al crear usuario:", error);
        const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}