import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import { roundMoney } from "@/lib/money";

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
                estado: true,
                productos: {
                    select: { cantidad: true, precioAcordado: true },
                },
                pagos: {
                    select: {
                        id: true,
                        monto: true,
                        fecha: true,
                        creador: {
                            select: { nombre: true },
                        },
                    },
                    orderBy: { fecha: "desc" },
                },
            },
        });

        if (!bid) {
            return NextResponse.json(
                { error: "Licitación no encontrada." },
                { status: 404 },
            );
        }

        const totalBilled = roundMoney(
            bid.productos.reduce(
                (sum, item) => sum + item.cantidad * Number(item.precioAcordado),
                0,
            ),
        );

        const totalPaid = roundMoney(
            bid.pagos.reduce((sum, payment) => sum + Number(payment.monto), 0),
        );

        const pendingBalance = roundMoney(totalBilled - totalPaid);

        return NextResponse.json(
            {
                estado: bid.estado,
                totalFacturado: totalBilled,
                totalPagado: totalPaid,
                saldoPendiente: pendingBalance,
                pagos: bid.pagos,
            },
            { status: 200 },
        );

    } catch (error) {
        console.error("Error al obtener los pagos:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}

type PaymentResult = {
    ok: boolean;
    status: number;
    message: string;
    isFullyPaid: boolean;
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
        const body = await request.json();
        const { monto } = body;

        const rawAmount = Number(monto);
        if (
            monto === undefined ||
            monto === null ||
            monto === "" ||
            (typeof monto !== "number" && typeof monto !== "string") ||
            !Number.isFinite(rawAmount)
        ) {
            return NextResponse.json(
                { error: "El monto es obligatorio y debe ser un número válido." },
                { status: 400 },
            );
        }

        const parsedAmount = roundMoney(rawAmount);

        if (parsedAmount <= 0) {
            return NextResponse.json(
                { error: "El monto debe ser un número mayor a 0." },
                { status: 400 },
            );
        }

        const result = await prisma.$transaction(async (tx): Promise<PaymentResult> => {
            const bid = await tx.licitacion.findUnique({
                where: { id: bidId },
                select: {
                    id: true,
                    estado: true,
                    productos: {
                        select: { cantidad: true, precioAcordado: true },
                    },
                    pagos: {
                        select: { monto: true },
                    },
                },
            });

            if (!bid) {
                return {
                    ok: false,
                    status: 404,
                    message: "Licitación no encontrada.",
                    isFullyPaid: false,
                };
            }

            if (bid.estado !== "por_cobrar") {
                return {
                    ok: false,
                    status: 403,
                    message: "Solo se pueden registrar pagos en licitaciones en estado por cobrar.",
                    isFullyPaid: false,
                };
            }

            const totalBilled = roundMoney(
                bid.productos.reduce(
                    (sum, item) => sum + item.cantidad * Number(item.precioAcordado),
                    0,
                ),
            );

            const totalPaid = roundMoney(
                bid.pagos.reduce((sum, payment) => sum + Number(payment.monto), 0),
            );

            const pendingBalance = roundMoney(totalBilled - totalPaid);

            if (parsedAmount > pendingBalance) {
                return {
                    ok: false,
                    status: 400,
                    message: `El pago (${parsedAmount.toFixed(2)}) excede el saldo pendiente (${pendingBalance.toFixed(2)}).`,
                    isFullyPaid: false,
                };
            }

            const newBalance = roundMoney(pendingBalance - parsedAmount);
            const isFullyPaid = newBalance <= 0;

            await tx.pago.create({
                data: {
                    licitacionId: bidId,
                    monto: parsedAmount,
                    createdBy: currentUser.id,
                },
            });

            await tx.licitacion.update({
                where: { id: bidId },
                data: {
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            });

            if (isFullyPaid) {
                await tx.licitacion.update({
                    where: { id: bidId },
                    data: {
                        estado: "cobrada",
                        updatedAt: new Date(),
                        updatedBy: currentUser.id,
                    },
                });

                await tx.historialTransicion.create({
                    data: {
                        licitacionId: bidId,
                        usuarioId: currentUser.id,
                        estadoAnterior: "por_cobrar",
                        estadoNuevo: "cobrada",
                    },
                });
            }

            return {
                ok: true,
                status: 201,
                message: isFullyPaid
                    ? "Pago registrado. La licitación quedó completamente cobrada."
                    : "Pago registrado exitosamente.",
                isFullyPaid,
            };
        });

        if (!result.ok) {
            return NextResponse.json(
                { error: result.message },
                { status: result.status },
            );
        }

        return NextResponse.json(
            {
                message: result.message,
                isFullyPaid: result.isFullyPaid,
            },
            { status: result.status },
        );

    } catch (error) {
        console.error("Error al registrar el pago:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}