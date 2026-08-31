import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

const BUCKET_NAME = "propuestas";

function extractStoragePath(publicUrl: string): string | null {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;

    const index = publicUrl.indexOf(marker);

    if (index === -1) {
        return null;
    }

    return publicUrl.substring(index + marker.length);
}

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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
                estado: true,
                documentoPropuestaUrl: true,
            },
        });

        if (!bid) {
            return NextResponse.json(
                { error: "Licitación no encontrada." },
                { status: 404 },
            );
        }

        if (bid.estado !== "borrador") {
            return NextResponse.json(
                {
                    error: "Solo se pueden eliminar licitaciones que estén en estado borrador.",
                },
                { status: 400 },
            );
        }

        if (bid.documentoPropuestaUrl) {
            const documentPath = extractStoragePath(
                bid.documentoPropuestaUrl,
            );

            if (documentPath) {
                const { error: removeError } = await supabaseAdmin.storage
                    .from(BUCKET_NAME)
                    .remove([documentPath]);

                if (removeError) {
                    throw removeError;
                }
            }
        }

        await prisma.licitacion.delete({
            where: { id: bidId },
        });

        return NextResponse.json(
            { message: "Licitación eliminada exitosamente." },
            { status: 200 },
        );

    } catch (error) {
        console.error("Error al eliminar la licitación:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}