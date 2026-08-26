import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sistema de Licitaciones",
    description: "Gestión de licitaciones comerciales",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body>
                {children}
            </body>
        </html>
    );
}