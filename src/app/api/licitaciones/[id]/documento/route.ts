import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const BUCKET_NAME = "propuestas";

function extractStoragePath(publicUrl: string): string | null {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const index = publicUrl.indexOf(marker);

    if (index === -1) return null;

    return publicUrl.substring(index + marker.length);
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

        const bid = await prisma.licitacion.findUnique({
            where: {
                id: bidId
            },

            select: {
                id: true,
                estado: true,
                documentoPropuestaUrl: true,
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
                { error: "Solo se puede subir el documento mientras la licitación está en borrador." },
                { status: 403 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No se envió ningún archivo." },
                { status: 400 },
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "El archivo no debe superar los 10MB." },
                { status: 400 },
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Solo se permiten archivos PDF o Word." },
                { status: 400 },
            );
        }

        if (bid.documentoPropuestaUrl) {
            const oldPath = extractStoragePath(bid.documentoPropuestaUrl);

            if (oldPath) {
                const { error: removeError } = await supabaseAdmin.storage
                    .from(BUCKET_NAME)
                    .remove([oldPath]);

                if (removeError) {
                    throw removeError;
                }
            }
        }

        const fileExt = file.name.split(".").pop();
        const filePath = `${bidId}/${Date.now()}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            return NextResponse.json(
                { error: "Error al subir el documento." },
                { status: 500 },
            );
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        await prisma.licitacion.update({
            where: {
                id: bidId
            },

            data: {
                documentoPropuestaUrl: publicUrlData.publicUrl,
                updatedAt: new Date(),
                updatedBy: currentUser.id,
            },
        });

        return NextResponse.json(
            {
                message: "Documento subido exitosamente.",
                url: publicUrlData.publicUrl,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error al subir el documento:", error);

        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 },
        );
    }
}