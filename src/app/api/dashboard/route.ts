import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import { roundMoney } from "@/lib/money";

export async function GET() {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const now = new Date();
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const [
            activeBidsCount,
            totalClientsCount,
            upcomingBids,
            payableBids,
            recentBids,
        ] = await Promise.all([
            prisma.licitacion.count({ where: { estado: "activa" } }),

            prisma.cliente.count(),

            prisma.licitacion.findMany({
                where: {
                    estado: "activa",
                    fechaLimite: { gte: now, lte: in48Hours },
                },
                select: {
                    id: true,
                    fechaLimite: true,
                    cliente: { select: { nombre: true } },
                },
                orderBy: { fechaLimite: "asc" },
            }),

            prisma.licitacion.findMany({
                where: { estado: "por_cobrar" },
                select: {
                    productos: {
                        select: { cantidad: true, precioAcordado: true },
                    },
                    pagos: {
                        select: { monto: true },
                    },
                },
            }),

            prisma.licitacion.findMany({
                select: {
                    id: true,
                    estado: true,
                    presupuestoMaximo: true,
                    fechaLimite: true,
                    createdAt: true,
                    cliente: { select: { nombre: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
        ]);

        const totalPorCobrar = roundMoney(
            payableBids.reduce((sum, bid) => {
                const facturado = bid.productos.reduce(
                    (s, item) => s + item.cantidad * Number(item.precioAcordado),
                    0
                );
                const pagado = bid.pagos.reduce((s, pago) => s + Number(pago.monto), 0);
                return sum + (facturado - pagado);
            }, 0)
        );

        const proximasAVencer = upcomingBids.map((bid) => {
            const horasRestantes = Math.max(
                0,
                Math.round((new Date(bid.fechaLimite).getTime() - now.getTime()) / (1000 * 60 * 60))
            );
            return {
                id: bid.id,
                cliente: bid.cliente.nombre,
                fechaLimite: bid.fechaLimite,
                horasRestantes,
            };
        });

        return NextResponse.json(
            {
                licitacionesActivas: activeBidsCount,
                totalClientes: totalClientsCount,
                proximasAVencer,
                totalPorCobrar,
                licitacionesRecientes: recentBids,
            },
            { status: 200 },
        );

    } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}