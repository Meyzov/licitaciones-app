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

        if (bid.estado !== "activa") {
            return NextResponse.json(
                { error: "Solo se pueden finalizar licitaciones en estado activa." },
                { status: 403 },
            );
        }

        await prisma.$transaction([
            prisma.licitacion.update({
                where: {
                    id: bidId
                },

                data: {
                    estado: "finalizada",
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            }),

            prisma.historialTransicion.create({
                data: {
                    licitacionId: bidId,
                    usuarioId: currentUser.id,
                    estadoAnterior: "activa",
                    estadoNuevo: "finalizada",
                },
            }),
        ]);

        return NextResponse.json(
            { message: "Licitación marcada como finalizada." },
            { status: 200 },
        );

    } catch (error) {

        console.error("Error al finalizar la licitación:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}