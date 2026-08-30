import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

export async function GET() {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const users = await prisma.usuario.findMany({
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

        return NextResponse.json(users, { status: 200 });

    } catch (error) {

        console.error("Error al obtener los usuarios:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        if (currentUser.role !== "admin") {
            return NextResponse.json(
                { error: "Acceso denegado. Se requieren permisos de administrador." },
                { status: 403 },
            );
        }

        const body = await request.json();
        const { name, email, password, role } = body;

        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            return NextResponse.json(
                { error: "Nombre, email y contraseña son obligatorios." },
                { status: 400 },
            );
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName || !normalizedEmail || !password) {
            return NextResponse.json(
                { error: "Nombre, email y contraseña son obligatorios." },
                { status: 400 },
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "La contraseña debe tener al menos 8 caracteres." },
                { status: 400 },
            );
        }

        if (role !== undefined && role !== "admin" && role !== "user") {
            return NextResponse.json(
                { error: "El rol especificado no es válido." },
                { status: 400 },
            );
        }

        const selectedRole = role ?? "user";

        const existingUser = await prisma.usuario.findUnique({
            where: {
                email: normalizedEmail,
            },

            select: {
                id: true,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Ya existe un usuario con ese correo electrónico." },
                { status: 409 },
            );
        }

        const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
                email: normalizedEmail,
                password,
                email_confirm: true,
            });

        if (authError || !authData.user) {
            console.error(
                "Error creando usuario en Supabase Auth:",
                authError,
            );

            return NextResponse.json(
                { error: "No se pudo crear el usuario en el sistema de autenticación." },
                { status: 400 },
            );
        }

        try {
            const newDbUser = await prisma.usuario.create({
                data: {
                    id: authData.user.id,
                    email: normalizedEmail,
                    nombre: normalizedName,
                    rol: selectedRole,
                },

                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    rol: true,
                },
            });

            return NextResponse.json(
                {
                    message: "Usuario creado exitosamente.",
                    user: {
                        id: newDbUser.id,
                        name: newDbUser.nombre,
                        email: newDbUser.email,
                        role: newDbUser.rol,
                    },
                },
                { status: 201 },
            );

        } catch (dbError) {

            console.error(
                "Error creando usuario en la base de datos:",
                dbError,
            );

            const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

            if (rollbackError) {
                console.error(
                    "Error haciendo rollback del usuario en Supabase Auth:",
                    rollbackError,
                );
            }

            throw dbError;
        }
    } catch (error) {

        console.error("Error al crear usuario:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}