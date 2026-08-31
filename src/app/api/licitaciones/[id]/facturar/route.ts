import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const { id: bidId } = await params;

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

            if (bid.estado !== "finalizada") {
                return {
                    ok: false,
                    status: 403,
                    message: "Solo se pueden facturar licitaciones en estado finalizada.",
                };
            }

            await tx.licitacion.update({
                where: { id: bidId },
                data: {
                    estado: "por_cobrar",
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            });

            await tx.historialTransicion.create({
                data: {
                    licitacionId: bidId,
                    usuarioId: currentUser.id,
                    estadoAnterior: "finalizada",
                    estadoNuevo: "por_cobrar",
                },
            });

            return {
                ok: true,
                status: 200,
                message: "Licitación facturada, ahora está en estado por cobrar.",
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
        console.error("Error al facturar la licitación:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}