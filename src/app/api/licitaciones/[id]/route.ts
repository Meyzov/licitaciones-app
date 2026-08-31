import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
            where: { id: bidId },
            select: {
                id: true,
                presupuestoMaximo: true,
                fechaLimite: true,
                estado: true,
                documentoPropuestaUrl: true,
                createdAt: true,
                updatedAt: true,
                cliente: {
                    select: { id: true, nombre: true, email: true },
                },
                creador: {
                    select: { nombre: true },
                },
                modificador: {
                    select: { nombre: true },
                },
                productos: {
                    select: {
                        cantidad: true,
                        precioAcordado: true,
                        producto: {
                            select: { id: true, nombre: true },
                        },
                    },
                },
                pagos: {
                    select: { id: true, monto: true, fecha: true },
                    orderBy: { fecha: "desc" },
                },
                historial: {
                    select: {
                        id: true,
                        estadoAnterior: true,
                        estadoNuevo: true,
                        fechaHora: true,
                        usuario: {
                            select: { nombre: true },
                        },
                    },
                    orderBy: { fechaHora: "desc" },
                },
            },
        });

        if (!bid) {
            return NextResponse.json(
                { error: "Licitación no encontrada." },
                { status: 404 },
            );
        }

        return NextResponse.json(bid, { status: 200 });

    } catch (error) {
        console.error("Error al obtener la licitación:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}