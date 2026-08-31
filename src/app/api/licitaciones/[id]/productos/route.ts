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

        const { id: licitacionId } = await params;
        const body = await request.json();
        const { productoId, cantidad, precioAcordado } = body;

        if (typeof productoId !== "string" || (typeof cantidad !== "number" && typeof cantidad !== "string") || (typeof precioAcordado !== "number" && typeof precioAcordado !== "string")) {
            return NextResponse.json(
                { error: "Los datos enviados no son válidos." },
                { status: 400 },
            );
        }

        const parsedCantidad = Number(cantidad);
        const parsedPrecio = Number(precioAcordado);

        if (!Number.isInteger(parsedCantidad) || parsedCantidad <= 0) {
            return NextResponse.json(
                { error: "La cantidad debe ser un entero mayor a 0." },
                { status: 400 },
            );
        }

        if (!Number.isFinite(parsedPrecio) || parsedPrecio <= 0) {
            return NextResponse.json(
                { error: "El precio acordado debe ser un número mayor a 0." },
                { status: 400 },
            );
        }

        const bid = await prisma.licitacion.findUnique({
            where: {
                id: licitacionId
            },

            include: {
                productos: {
                    include: {
                        producto: true,
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

        if (bid.estado !== "borrador" && bid.estado !== "activa") {
            return NextResponse.json(
                { error: "Solo se pueden modificar productos en licitaciones en estado borrador o activa." },
                { status: 403 },
            );
        }

        const product = await prisma.producto.findUnique({
            where: {
                id: productoId
            },

            select: {
                id: true,
                nombre: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "El producto seleccionado no existe." },
                { status: 404 },
            );
        }

        const existingProduct = bid.productos.find((p) => p.productoId === productoId);
        if (existingProduct) {
            return NextResponse.json(
                { error: "El producto ya está agregado a esta licitación." },
                { status: 409 },
            );
        }

        const currentTotal = roundMoney(
            bid.productos.reduce(
                (sum, item) => sum + Number(item.cantidad) * Number(item.precioAcordado),
                0
            )
        );

        const newSubtotal = roundMoney(parsedCantidad * parsedPrecio);
        const newTotal = roundMoney(currentTotal + newSubtotal);
        const maxBudget = Number(bid.presupuestoMaximo);

        if (newTotal > maxBudget) {
            return NextResponse.json(
                { error: `El total de productos (${newTotal.toFixed(2)}) excede el presupuesto máximo (${maxBudget.toFixed(2)}).` },
                { status: 400 },
            );
        }

        await prisma.licitacionProducto.create({
            data: {
                licitacionId,
                productoId,
                cantidad: parsedCantidad,
                precioAcordado: parsedPrecio,
            },
        });

        await prisma.licitacion.update({
            where: { id: licitacionId },
            data: {
                updatedAt: new Date(),
                updatedBy: currentUser.id,
            },
        });

        return NextResponse.json(
            { message: "Producto agregado exitosamente." },
            { status: 201 },
        );

    } catch (error) {

        console.error("Error al agregar producto a la licitación:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}