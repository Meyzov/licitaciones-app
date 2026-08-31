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
            where: {
                id: bidId
            },

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
                            select: {
                                nombre: true
                            }
                        },
                    },

                    orderBy: {
                        fecha: "desc"
                    },
                },
            },
        });

        if (!bid) {
            return NextResponse.json(
                { error: "Licitación no encontrada." },
                { status: 404 },
            );
        }

        const totalFacturado = roundMoney(
            bid.productos.reduce(
                (sum, item) => sum + item.cantidad * Number(item.precioAcordado),
                0
            )
        );

        const totalPagado = roundMoney(
            bid.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0)
        );

        const saldoPendiente = roundMoney(totalFacturado - totalPagado);

        return NextResponse.json(
            {
                estado: bid.estado,
                totalFacturado,
                totalPagado,
                saldoPendiente,
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

        if (typeof monto !== "number" && typeof monto !== "string") {
            return NextResponse.json(
                { error: "El monto es obligatorio." },
                { status: 400 },
            );
        }

        const parsedMonto = roundMoney(Number(monto));

        if (!Number.isFinite(parsedMonto) || parsedMonto <= 0) {
            return NextResponse.json(
                { error: "El monto debe ser un número mayor a 0." },
                { status: 400 },
            );
        }

        const bid = await prisma.licitacion.findUnique({
            where: {
                id: bidId
            },

            select: {
                id: true,
                estado: true,

                productos: {
                    select: {
                        cantidad: true,
                        precioAcordado: true
                    },
                },

                pagos: {
                    select: {
                        monto: true
                    },
                },
            },
        });

        if (!bid) {
            return NextResponse.json(
                { error: "Licitación no encontrada." },
                { status: 404 },
            );
        }

        if (bid.estado !== "por_cobrar") {
            return NextResponse.json(
                { error: "Solo se pueden registrar pagos en licitaciones en estado por cobrar." },
                { status: 403 },
            );
        }

        const totalFacturado = bid.productos.reduce((sum, item) => sum + item.cantidad * Number(item.precioAcordado), 0);
        const totalPagado = bid.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);

        const saldoPendiente = totalFacturado - totalPagado;

        if (parsedMonto > saldoPendiente) {
            return NextResponse.json(
                { error: `El pago (${parsedMonto.toFixed(2)}) excede el saldo pendiente (${saldoPendiente.toFixed(2)}).` },
                { status: 400 },
            );
        }

        const nuevoSaldo = roundMoney(saldoPendiente - parsedMonto);
        const saldaCompleto = nuevoSaldo <= 0;

        const operations = [
            prisma.pago.create({
                data: {
                    licitacionId: bidId,
                    monto: parsedMonto,
                    createdBy: currentUser.id,
                },
            }),
        ];

        if (saldaCompleto) {
            operations.push(
                prisma.licitacion.update({
                    where: {
                        id: bidId
                    },

                    data: {
                        estado: "cobrada",
                        updatedAt: new Date(),
                        updatedBy: currentUser.id,
                    },
                }) as never,

                prisma.historialTransicion.create({
                    data: {
                        licitacionId: bidId,
                        usuarioId: currentUser.id,
                        estadoAnterior: "por_cobrar",
                        estadoNuevo: "cobrada",
                    },
                }) as never,
            );
        }

        await prisma.$transaction(operations);

        return NextResponse.json(
            {
                message: saldaCompleto
                    ? "Pago registrado. La licitación quedó completamente cobrada."
                    : "Pago registrado exitosamente.",
                saldaCompleto,
            },
            { status: 201 },
        );

    } catch (error) {
        console.error("Error al registrar el pago:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}