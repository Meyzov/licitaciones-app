import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

export async function GET() {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const clients = await prisma.cliente.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
                createdAt: true,
                updatedAt: true,

                creador: {
                    select: {
                        nombre: true,
                    },
                },

                modificador: {
                    select: {
                        nombre: true,
                    },
                },
            },

            orderBy: {
                nombre: "asc",
            },
        });

        return NextResponse.json(clients, { status: 200 });

    } catch (error) {

        console.error("Error al obtener los clientes:", error);
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

        const body = await request.json();
        const { name, email } = body;

        if (typeof name !== "string" || typeof email !== "string") {
            return NextResponse.json(
                { error: "Nombre y email son obligatorios." },
                { status: 400 },
            );
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName || !normalizedEmail) {
            return NextResponse.json(
                { error: "Nombre y email son obligatorios." },
                { status: 400 },
            );
        }

        const newClient = await prisma.cliente.create({
            data: {
                nombre: normalizedName,
                email: normalizedEmail,
                createdBy: currentUser.id,
                updatedAt: null,
            },
        });

        return NextResponse.json(
            {
                message: "Cliente creado exitosamente.",
                client: {
                    id: newClient.id,
                    name: newClient.nombre,
                    email: newClient.email,
                },
            },
            { status: 201 },
        );
    } catch (error) {

        console.error("Error al crear el cliente:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}