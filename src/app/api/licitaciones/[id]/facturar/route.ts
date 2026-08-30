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

        const bid = await prisma.licitacion.findUnique({
            where: {
                id: bidId
            },

            select: {
                id: true,
                estado: true
            },
        });

        if (!bid) {
            return NextResponse.json(
                { error: "Licitación no encontrada." },
                { status: 404 },
            );
        }

        if (bid.estado !== "finalizada") {
            return NextResponse.json(
                { error: "Solo se pueden facturar licitaciones en estado finalizada." },
                { status: 403 },
            );
        }

        await prisma.$transaction([
            prisma.licitacion.update({
                where: {
                    id: bidId
                },

                data: {
                    estado: "por_cobrar",
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            }),
            prisma.historialTransicion.create({
                data: {
                    licitacionId: bidId,
                    usuarioId: currentUser.id,
                    estadoAnterior: "finalizada",
                    estadoNuevo: "por_cobrar",
                },
            }),
        ]);

        return NextResponse.json(
            { message: "Licitación facturada, ahora está en estado por cobrar." },
            { status: 200 },
        );

    } catch (error) {

        console.error("Error al facturar la licitación:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}