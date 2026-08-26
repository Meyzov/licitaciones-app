import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de Licitaciones - Login",
  description: "Acceso al sistema de gestión de licitaciones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}