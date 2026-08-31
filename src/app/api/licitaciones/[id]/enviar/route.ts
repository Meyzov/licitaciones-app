import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import { EmailTemplate } from "@/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(price);
};

const formatDate = (date: Date) => {
    return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

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
            where: { id: bidId },
            include: {
                cliente: true,
                productos: {
                    include: { producto: true },
                },
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
                { error: "Solo se pueden enviar licitaciones en estado borrador." },
                { status: 403 },
            );
        }

        if (!bid.documentoPropuestaUrl) {
            return NextResponse.json(
                { error: "Debes subir el documento de propuesta antes de enviar la licitación." },
                { status: 400 },
            );
        }

        const docResponse = await fetch(bid.documentoPropuestaUrl);
        if (!docResponse.ok) {
            return NextResponse.json(
                { error: "No se pudo obtener el documento para adjuntarlo al correo." },
                { status: 500 },
            );
        }

        const docBuffer = Buffer.from(await docResponse.arrayBuffer());
        const docFileName = bid.documentoPropuestaUrl.split("/").pop() || "propuesta.pdf";

        const { error: emailError } = await resend.emails.send({
            from: "Licitaciones <onboarding@resend.dev>",
            to: bid.cliente.email,
            subject: `Nueva licitación comercial - ${bid.cliente.nombre}`,
            react: EmailTemplate({
                clienteNombre: bid.cliente.nombre,
                presupuestoMaximo: Number(bid.presupuestoMaximo),
                fechaLimite: bid.fechaLimite,
                productos: bid.productos,
                formatPrice,
                formatDate,
            }),
            attachments: [
                {
                    filename: docFileName,
                    content: docBuffer,
                },
            ],
        });

        if (emailError) {
            return NextResponse.json(
                { error: "No se pudo enviar el correo al cliente. Intenta nuevamente." },
                { status: 500 },
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.licitacion.update({
                where: { id: bidId },
                data: {
                    estado: "activa",
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            });

            await tx.historialTransicion.create({
                data: {
                    licitacionId: bidId,
                    usuarioId: currentUser.id,
                    estadoAnterior: "borrador",
                    estadoNuevo: "activa",
                },
            });

            return {
                ok: true,
                status: 200,
                message: "Licitación enviada exitosamente.",
            };
        });

        return NextResponse.json(
            { message: result.message },
            { status: result.status },
        );

    } catch (error) {
        console.error("Error al enviar la licitación:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}