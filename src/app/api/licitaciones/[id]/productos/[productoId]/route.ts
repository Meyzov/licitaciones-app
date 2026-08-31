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
        const bidId = resolvedParams?.id?.trim();
        const productId = resolvedParams?.productoId?.trim();

        if (!bidId || !productId) {
            return NextResponse.json(
                { error: "Faltan parámetros requeridos." },
                { status: 400 },
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const bid = await tx.licitacion.findUnique({
                where: { id: bidId },
                select: { id: true, estado: true },
            });

            if (!bid) {
                return {
                    ok: false,
                    status: 404,
                    message: "Licitación no encontrada.",
                };
            }

            if (bid.estado !== "borrador" && bid.estado !== "activa") {
                return {
                    ok: false,
                    status: 403,
                    message: "Acción no permitida para el estado actual.",
                };
            }

            const existingItem = await tx.licitacionProducto.findUnique({
                where: {
                    licitacionId_productoId: {
                        licitacionId: bidId,
                        productoId: productId,
                    },
                },
            });

            if (!existingItem) {
                return {
                    ok: false,
                    status: 404,
                    message: "El producto no está asociado a esta licitación.",
                };
            }

            await tx.licitacionProducto.delete({
                where: {
                    licitacionId_productoId: {
                        licitacionId: bidId,
                        productoId: productId,
                    },
                },
            });

            await tx.licitacion.update({
                where: { id: bidId },
                data: {
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            });

            return {
                ok: true,
                status: 200,
                message: "Producto eliminado de la licitación.",
            };
        });

        if (!result.ok) {
            return NextResponse.json(
                { error: result.message },
                { status: result.status },
            );
        }

        return NextResponse.json(
            { message: result.message },
            { status: result.status },
        );

    } catch (error) {
        console.error("Error al eliminar el producto de la licitación:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}