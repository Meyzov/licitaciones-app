import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { EmailReminderTemplate } from "@/components/email-reminder-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID;

const formatDate = (date: Date) => {
    return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: "No autorizado." },
                { status: 401 },
            );
        }

        if (!SYSTEM_USER_ID) {
            console.error("Falta la variable de entorno SYSTEM_USER_ID.");
            return NextResponse.json(
                { error: "Configuración del sistema incompleta." },
                { status: 500 },
            );
        }

        const now = new Date();
        console.log("Ejecutando cron de verificación de vencimientos...", now);

        const activeBids = await prisma.licitacion.findMany({
            where: { estado: "activa" },
            include: {
                cliente: true,
                productos: {
                    include: { producto: true },
                },
            },
        });

        let expiredCount = 0;
        let remindersSent = 0;
        let errors = 0;

        for (const bid of activeBids) {
            try {
                const deadline = new Date(bid.fechaLimite);
                const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

                if (deadline <= now) {
                    await prisma.$transaction(async (tx) => {
                        await tx.licitacion.update({
                            where: { id: bid.id },
                            data: {
                                estado: "perdida",
                                updatedAt: new Date(),
                                updatedBy: SYSTEM_USER_ID,
                            },
                        });

                        await tx.historialTransicion.create({
                            data: {
                                licitacionId: bid.id,
                                usuarioId: SYSTEM_USER_ID,
                                estadoAnterior: "activa",
                                estadoNuevo: "perdida",
                            },
                        });
                    });

                    expiredCount++;
                    console.log(`Licitación ${bid.id} vencida. Cambiada automáticamente a 'perdida'.`);
                    continue;
                }

                if (hoursRemaining > 0 && hoursRemaining <= 48 && !bid.recordatorioEnviado) {
                    console.log(`Licitación ${bid.id} próxima a vencer en ${hoursRemaining.toFixed(1)} horas.`);

                    const { error: emailError } = await resend.emails.send({
                        from: "Licitaciones <onboarding@resend.dev>",
                        to: bid.cliente.email,
                        subject: `Recordatorio Urgente: Licitación próxima a vencer - ${bid.cliente.nombre}`,
                        react: EmailReminderTemplate({
                            clienteNombre: bid.cliente.nombre,
                            fechaLimite: bid.fechaLimite,
                            formatDate,
                        }),
                    });

                    if (emailError) {
                        console.error(`Error enviando email para ${bid.id}:`, emailError);
                        continue;
                    }

                    await prisma.$transaction(async (tx) => {
                        await tx.licitacion.update({
                            where: { id: bid.id },
                            data: {
                                recordatorioEnviado: true,
                                updatedAt: new Date(),
                                updatedBy: SYSTEM_USER_ID,
                            },
                        });
                    });

                    remindersSent++;
                    console.log(`Recordatorio enviado y marcado para licitación ${bid.id}.`);
                }
            } catch (itemError) {
                errors++;
                console.error(`Error procesando licitación ${bid.id}:`, itemError);
            }
        }

        return NextResponse.json(
            {
                message: "Cron ejecutado exitosamente.",
                licitacionesVencidasAPerdida: expiredCount,
                recordatoriosEnviados: remindersSent,
                errores: errors,
                totalProcesadas: activeBids.length,
            },
            { status: 200 },
        );

    } catch (error) {
        console.error("Error al ejecutar el cron de vencimientos:", error);
        return NextResponse.json(
            { error: "Error interno del servidor en el cron." },
            { status: 500 },
        );
    }
}