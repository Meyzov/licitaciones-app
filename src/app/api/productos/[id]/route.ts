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

        const { id } = await params;

        const product = await prisma.producto.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                nombre: true,
                precioBase: true,
                createdAt: true,
                updatedAt: true,
                creador: {
                    select: {
                        nombre: true,
                    },
                },
                modificador: {
                    select: {
                        nombre: true,
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Producto no encontrado." },
                { status: 404 },
            );
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error("Error al obtener el producto:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const { id } = await params;

        const body = await request.json();

        const { name, basePrice } = body;

        if (typeof name !== "string") {
            return NextResponse.json(
                { error: "El nombre del producto es obligatorio." },
                { status: 400 },
            );
        }

        const normalizedName = name.trim();

        if (!normalizedName) {
            return NextResponse.json(
                { error: "El nombre del producto es obligatorio." },
                { status: 400 },
            );
        }

        const rawPrice = Number(basePrice);

        if (
            basePrice === undefined ||
            basePrice === null ||
            basePrice === "" ||
            (typeof basePrice !== "number" &&
                typeof basePrice !== "string") ||
            !Number.isFinite(rawPrice)
        ) {
            return NextResponse.json(
                {
                    error: "El precio base es obligatorio y debe ser un número válido.",
                },
                { status: 400 },
            );
        }

        const parsedPrice = rawPrice;

        if (parsedPrice <= 0) {
            return NextResponse.json(
                {
                    error: "El precio base debe ser un número mayor a 0.",
                },
                { status: 400 },
            );
        }

        const existingProduct = await prisma.producto.findUnique({
            where: {
                id,
            },
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Producto no encontrado." },
                { status: 404 },
            );
        }

        const updatedProduct = await prisma.producto.update({
            where: {
                id,
            },
            data: {
                nombre: normalizedName,
                precioBase: parsedPrice,
                updatedAt: new Date(),
                updatedBy: currentUser.id,
            },
            select: {
                id: true,
                nombre: true,
                precioBase: true,
                createdAt: true,
                updatedAt: true,
                creador: {
                    select: {
                        nombre: true,
                    },
                },
                modificador: {
                    select: {
                        nombre: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                message: "Producto actualizado exitosamente.",
                product: updatedProduct,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error al actualizar el producto:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}