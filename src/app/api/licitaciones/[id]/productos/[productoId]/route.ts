import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; productoId: string }> }) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado." },
                { status: 401 },
            );
        }

        const resolvedParams = await params;
        const licitacionId = resolvedParams?.id?.trim();
        const productoId = resolvedParams?.productoId?.trim();

        if (!licitacionId || !productoId) {
            return NextResponse.json(
                {
                    error: "Faltan parámetros requeridos.",
                },
                { status: 400 },
            );
        }

        const bid = await prisma.licitacion.findUnique({
            where: {
                id: licitacionId
            },

            select: {
                id: true,
                estado: true,
            },
        });

        if (!bid) {
            return NextResponse.json(
                { error: "Licitación no encontrada." },
                { status: 404 },
            );
        }

        if (bid.estado !== "borrador" && bid.estado !== "activa") {
            return NextResponse.json(
                { error: "Acción no permitida para el estado actual." },
                { status: 403 },
            );
        }

        const existingProduct =
            await prisma.licitacionProducto.findUnique({
                where: {
                    licitacionId_productoId: {
                        licitacionId,
                        productoId,
                    },
                },
            });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "El producto no está asociado a esta licitación." },
                { status: 404 },
            );
        }

        await prisma.licitacionProducto.delete({
            where: {
                licitacionId_productoId: {
                    licitacionId,
                    productoId,
                },
            },
        });

        await prisma.licitacion.update({
            where: {
                id: licitacionId
            },

            data: {
                updatedAt: new Date(),
                updatedBy: currentUser.id,
            },
        });

        return NextResponse.json(
            { message: "Operación exitosa." },
            { status: 200 },
        );

    } catch {
        return NextResponse.json(
            { error: "Error interno del servidor."},
            { status: 500 },
        );
    }
}