import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

export async function GET() {
    try {
        const currentUser = await getAuthenticatedUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 }
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
                    select: { nombre: true },
                },
                modificador: {
                    select: { nombre: true },
                },
            },
            orderBy: {
                nombre: "asc",
            },
        });

        return NextResponse.json(clients, { status: 200 });

    } catch (error: unknown) {
        console.error("Error fetching clients:", error);
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

        const body = await request.json();
        const { name, email } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios (nombre, email)." },
                { status: 400 }
            );
        }

        const newClient = await prisma.cliente.create({
            data: {
                nombre: name,
                email,
                createdBy: currentUser.id,
            },
        });

        return NextResponse.json(
            {
                message: "Cliente creado exitosamente",
                client: {
                    id: newClient.id,
                    name: newClient.nombre,
                    email: newClient.email,
                },
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Error creating client:", error);
        const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}