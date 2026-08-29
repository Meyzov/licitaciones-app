import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

export async function GET() {
    try {
        const currentUser = await getAuthenticatedUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 }
            );
        }

        const products = await prisma.producto.findMany({
            select: {
                id: true,
                nombre: true,
                precioBase: true,
                createdAt: true,
                updatedAt: true,
                creador: {
                    select: { nombre: true },
                },
                modificador: {
                    select: { nombre: true },
                },
            },
            orderBy: {
                nombre: "asc",
            },
        });

        return NextResponse.json(products, { status: 200 });

    } catch (error: unknown) {
        console.error("Error fetching products:", error);
        const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getAuthenticatedUser();
        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, basePrice } = body;

        if (!name || basePrice === undefined || basePrice === null) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios (nombre, precio base)." },
                { status: 400 }
            );
        }

        const parsedPrice = Number(basePrice);

        if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
            return NextResponse.json(
                { error: "El precio base debe ser un número mayor a 0." },
                { status: 400 }
            );
        }

        const newProduct = await prisma.producto.create({
            data: {
                nombre: name,
                precioBase: parsedPrice,
                createdBy: currentUser.id,
            },
        });

        return NextResponse.json(
            {
                message: "Producto creado exitosamente",
                product: {
                    id: newProduct.id,
                    name: newProduct.nombre,
                    basePrice: newProduct.precioBase,
                },
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Error creating product:", error);
        const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}