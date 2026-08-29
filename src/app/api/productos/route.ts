import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

export async function GET() {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
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
    } catch (error) {
        console.error("Error al obtener los productos:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getAuthenticatedUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "No autorizado. Inicia sesión para continuar." },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { name, basePrice } = body;

        if (
            typeof name !== "string" ||
            basePrice === undefined ||
            basePrice === null
        ) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios (nombre, precio base)." },
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

        const parsedPrice = Number(basePrice);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            return NextResponse.json(
                { error: "El precio base debe ser un número mayor a 0." },
                { status: 400 },
            );
        }

        const newProduct = await prisma.producto.create({
            data: {
                nombre: normalizedName,
                precioBase: parsedPrice,
                createdBy: currentUser.id,
                updatedAt: null
            },
        });

        return NextResponse.json(
            {
                message: "Producto creado exitosamente.",
                product: {
                    id: newProduct.id,
                    name: newProduct.nombre,
                    basePrice: newProduct.precioBase,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Error al crear el producto:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}