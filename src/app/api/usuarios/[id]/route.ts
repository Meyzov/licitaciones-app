import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const { id } = await params;

        if (currentUser.id !== id) {
            return NextResponse.json(
                { error: "Acceso denegado. Solo puedes consultar tu propia información." },
                { status: 403 },
            );
        }

        const user = await prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado." },
                { status: 404 },
            );
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("Error al obtener el usuario:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request, { params }: RouteContext) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const { id } = await params;

        if (currentUser.id !== id) {
            return NextResponse.json(
                { error: "Acceso denegado. Solo puedes modificar tu propia información." },
                { status: 403 },
            );
        }

        const body = await request.json();

        const { email, password } = body;

        if (email === undefined && password === undefined) {
            return NextResponse.json(
                { error: "Debes proporcionar al menos un dato para actualizar." },
                { status: 400 },
            );
        }

        if (email !== undefined && typeof email !== "string") {
            return NextResponse.json(
                { error: "El email debe ser una cadena de texto." },
                { status: 400 },
            );
        }

        if (password !== undefined && typeof password !== "string") {
            return NextResponse.json(
                { error: "La contraseña debe ser una cadena de texto." },
                { status: 400 },
            );
        }

        let normalizedEmail: string | undefined;

        if (email !== undefined) {
            normalizedEmail = email.trim().toLowerCase();

            if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
                return NextResponse.json(
                    { error: "El email no es válido." },
                    { status: 400 },
                );
            }
        }

        if (password !== undefined && password.length < 8) {
            return NextResponse.json(
                { error: "La contraseña debe tener al menos 8 caracteres." },
                { status: 400 },
            );
        }

        const existingUser = await prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "Usuario no encontrado." },
                { status: 404 },
            );
        }

        if (
            normalizedEmail !== undefined &&
            normalizedEmail !== existingUser.email
        ) {
            const emailInUse = await prisma.usuario.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
            });

            if (emailInUse && emailInUse.id !== id) {
                return NextResponse.json(
                    { error: "Ya existe un usuario con ese correo electrónico." },
                    { status: 409 },
                );
            }
        }

        const authUpdateData: {
            email?: string;
            password?: string;
        } = {};

        if (normalizedEmail !== undefined) {
            authUpdateData.email = normalizedEmail;
        }

        if (password !== undefined) {
            authUpdateData.password = password;
        }

        const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.updateUserById(
                id,
                authUpdateData,
            );

        if (authError || !authData.user) {
            console.error(
                "Error actualizando usuario en Supabase Auth:",
                authError,
            );

            return NextResponse.json(
                { error: "No se pudo actualizar la información de autenticación." },
                { status: 400 },
            );
        }

        try {
            const updatedUser = await prisma.usuario.update({
                where: { id },
                data: {
                    ...(normalizedEmail !== undefined && {
                        email: normalizedEmail,
                    }),
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
                    message: "Información actualizada exitosamente.",
                    user: {
                        id: updatedUser.id,
                        name: updatedUser.nombre,
                        email: updatedUser.email,
                        role: updatedUser.rol,
                    },
                },
                { status: 200 },
            );
        } catch (dbError) {
            console.error(
                "Error actualizando usuario en la base de datos:",
                dbError,
            );

            if (existingUser.email !== normalizedEmail) {
                const { error: rollbackError } =
                    await supabaseAdmin.auth.admin.updateUserById(id, {
                        email: existingUser.email,
                    });

                if (rollbackError) {
                    console.error(
                        "Error haciendo rollback del email en Supabase Auth:",
                        rollbackError,
                    );
                }
            }

            throw dbError;
        }
    } catch (error) {
        console.error("Error al actualizar usuario:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}