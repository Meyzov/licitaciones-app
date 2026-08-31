import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "El ID del cliente es obligatorio." },
                { status: 400 },
            );
        }

        const client = await prisma.cliente.findUnique({
            where: { id },
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
        });

        if (!client) {
            return NextResponse.json(
                { error: "Cliente no encontrado." },
                { status: 404 },
            );
        }

        return NextResponse.json(client, { status: 200 });
    } catch (error) {
        console.error("Error al obtener el cliente:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "El ID del cliente es obligatorio." },
                { status: 400 },
            );
        }

        const body = await request.json();

        const { name, email } = body;

        if (typeof name !== "string") {
            return NextResponse.json(
                { error: "El nombre es obligatorio." },
                { status: 400 },
            );
        }

        const normalizedName = name.trim();

        if (!normalizedName) {
            return NextResponse.json(
                { error: "El nombre es obligatorio." },
                { status: 400 },
            );
        }

        if (typeof email !== "string") {
            return NextResponse.json(
                { error: "El email es obligatorio." },
                { status: 400 },
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
            return NextResponse.json(
                { error: "El email no es válido." },
                { status: 400 },
            );
        }

        const existingClient = await prisma.cliente.findUnique({
            where: { id },
        });

        if (!existingClient) {
            return NextResponse.json(
                { error: "Cliente no encontrado." },
                { status: 404 },
            );
        }

        const updatedClient = await prisma.cliente.update({
            where: { id },
            data: {
                nombre: normalizedName,
                email: normalizedEmail,
                updatedBy: currentUser.id,
            },
        });

        return NextResponse.json(
            {
                message: "Cliente actualizado exitosamente.",
                client: {
                    id: updatedClient.id,
                    name: updatedClient.nombre,
                    email: updatedClient.email,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error al actualizar el cliente:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}