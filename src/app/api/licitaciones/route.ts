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

        const bids = await prisma.licitacion.findMany({
            select: {
                id: true,
                presupuestoMaximo: true,
                fechaLimite: true,
                estado: true,
                createdAt: true,
                updatedAt: true,

                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },

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
                createdAt: "desc",
            },
        });

        return NextResponse.json(bids, { status: 200 });

    } catch (error) {

        console.error("Error al obtener las licitaciones:", error);

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
        const { clientId, maxBudget, deadline } = body;

        if (typeof clientId !== "string" || (typeof maxBudget !== "number" && typeof maxBudget !== "string") || typeof deadline !== "string") {
            return NextResponse.json(
                { error: "Los datos enviados no son válidos." },
                { status: 400 },
            );
        }

        const normalizedClientId = clientId.trim();

        if (!normalizedClientId) {
            return NextResponse.json(
                { error: "El cliente es obligatorio." },
                { status: 400 },
            );
        }

        const parsedBudget = Number(maxBudget);

        if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
            return NextResponse.json(
                { error: "El presupuesto máximo debe ser un número mayor a 0." },
                { status: 400 },
            );
        }

        const parsedDeadline = new Date(deadline);

        if (Number.isNaN(parsedDeadline.getTime())) {
            return NextResponse.json(
                { error: "La fecha límite no es válida." },
                { status: 400 },
            );
        }

        if (parsedDeadline <= new Date()) {
            return NextResponse.json(
                { error: "La fecha límite debe ser una fecha futura." },
                { status: 400 },
            );
        }

        const client = await prisma.cliente.findUnique({
            where: {
                id: normalizedClientId,
            },

            select: {
                id: true,
            },
        });

        if (!client) {
            return NextResponse.json(
                { error: "El cliente seleccionado no existe." },
                { status: 404 },
            );
        }

        const newBid = await prisma.licitacion.create({
            data: {
                clienteId: client.id,
                presupuestoMaximo: parsedBudget,
                fechaLimite: parsedDeadline,
                estado: "borrador",
                createdBy: currentUser.id,
                updatedAt: null,
            },
        });

        return NextResponse.json(
            {
                message: "Licitación creada exitosamente.",
                bid: {
                    id: newBid.id,
                    state: newBid.estado,
                },
            },
            { status: 201 },
        );

    } catch (error) {

        console.error("Error al crear la licitación:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}