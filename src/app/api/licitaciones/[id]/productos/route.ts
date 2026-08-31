import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import { roundMoney } from "@/lib/money";

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
        const { productoId, cantidad, precioAcordado } = body;

        if (typeof productoId !== "string" || !productoId.trim()) {
            return NextResponse.json(
                { error: "El producto es obligatorio." },
                { status: 400 },
            );
        }

        const rawQuantity = Number(cantidad);
        if (
            cantidad === undefined ||
            cantidad === null ||
            cantidad === "" ||
            (typeof cantidad !== "number" && typeof cantidad !== "string") ||
            !Number.isFinite(rawQuantity)
        ) {
            return NextResponse.json(
                { error: "La cantidad es obligatoria y debe ser un número válido." },
                { status: 400 },
            );
        }

        const rawPrice = Number(precioAcordado);
        if (
            precioAcordado === undefined ||
            precioAcordado === null ||
            precioAcordado === "" ||
            (typeof precioAcordado !== "number" && typeof precioAcordado !== "string") ||
            !Number.isFinite(rawPrice)
        ) {
            return NextResponse.json(
                { error: "El precio acordado es obligatorio y debe ser un número válido." },
                { status: 400 },
            );
        }

        const parsedQuantity = Math.floor(rawQuantity);
        const parsedPrice = roundMoney(rawPrice);

        if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
            return NextResponse.json(
                { error: "La cantidad debe ser un entero mayor a 0." },
                { status: 400 },
            );
        }

        if (parsedPrice <= 0) {
            return NextResponse.json(
                { error: "El precio acordado debe ser un número mayor a 0." },
                { status: 400 },
            );
        }

        const productId = productoId.trim();

        const result = await prisma.$transaction(async (tx) => {
            const bid = await tx.licitacion.findUnique({
                where: { id: bidId },
                include: {
                    productos: {
                        select: {
                            productoId: true,
                            cantidad: true,
                            precioAcordado: true,
                        },
                    },
                },
            });

            if (!bid) {
                return {
                    ok: false,
                    status: 404,
                    message: "Licitación no encontrada.",
                };
            }

            if (bid.estado !== "borrador" && bid.estado !== "activa") {
                return {
                    ok: false,
                    status: 403,
                    message: "Solo se pueden modificar productos en licitaciones en estado borrador o activa.",
                };
            }

            const product = await tx.producto.findUnique({
                where: { id: productId },
                select: { id: true },
            });

            if (!product) {
                return {
                    ok: false,
                    status: 404,
                    message: "El producto seleccionado no existe.",
                };
            }

            const existingItem = bid.productos.find((p) => p.productoId === productId);
            if (existingItem) {
                return {
                    ok: false,
                    status: 409,
                    message: "El producto ya está agregado a esta licitación.",
                };
            }

            const currentTotal = roundMoney(
                bid.productos.reduce(
                    (sum, item) => sum + Number(item.cantidad) * Number(item.precioAcordado),
                    0,
                ),
            );

            const newSubtotal = roundMoney(parsedQuantity * parsedPrice);
            const newTotal = roundMoney(currentTotal + newSubtotal);
            const maxBudget = Number(bid.presupuestoMaximo);

            if (newTotal > maxBudget) {
                return {
                    ok: false,
                    status: 400,
                    message: `El total de productos (${newTotal.toFixed(2)}) excede el presupuesto máximo (${maxBudget.toFixed(2)}).`,
                };
            }

            await tx.licitacionProducto.create({
                data: {
                    licitacionId: bidId,
                    productoId: productId,
                    cantidad: parsedQuantity,
                    precioAcordado: parsedPrice,
                },
            });

            await tx.licitacion.update({
                where: { id: bidId },
                data: {
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            });

            return {
                ok: true,
                status: 201,
                message: "Producto agregado exitosamente.",
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
        console.error("Error al agregar producto a la licitación:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}