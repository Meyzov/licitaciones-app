import { Decimal } from "@prisma/client/runtime/index-browser";

interface ProductItem {
    cantidad: number;
    precioAcordado: Decimal | number | string;
    producto: { nombre: string };
}

interface EmailTemplateProps {
    clienteNombre: string;
    presupuestoMaximo: Decimal | number | string;
    fechaLimite: Date | string;
    productos: ProductItem[];
    formatPrice: (price: number) => string;
    formatDate: (date: Date) => string;
}

function toNumber(value: Decimal | number | string): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(value);
    return value.toNumber();
}

export function EmailTemplate({
    clienteNombre,
    presupuestoMaximo,
    fechaLimite,
    productos,
    formatPrice,
    formatDate,
}: EmailTemplateProps) {
    const safeDate = fechaLimite instanceof Date ? fechaLimite : new Date(fechaLimite);

    return (
        <div style={{
            fontFamily: "'Courier New', Courier, Georgia, serif",
            backgroundColor: "#f4f1ea",
            margin: 0,
            padding: "24px 12px",
            width: "100%",
            boxSizing: "border-box",
        }}>
            <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{
                width: "100%",
                maxWidth: "600px",
                margin: "0 auto",
                backgroundColor: "#fbf9f5",
                borderRadius: "8px",
                border: "1px solid #e3decb",
                boxShadow: "0 4px 16px rgba(110, 100, 85, 0.08)",
                overflow: "hidden",
            }}>
                <tbody>
                    <tr>
                        <td style={{
                            backgroundColor: "#e3ede8",
                            padding: "28px 32px",
                            textAlign: "center",
                            borderBottom: "1px solid #d0dfd7",
                        }}>
                            <span style={{
                                display: "inline-block",
                                backgroundColor: "#ffffff",
                                color: "#456253",
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "1.5px",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                marginBottom: "12px",
                                border: "1px solid #cce0d5",
                            }}>
                                Licitación Oficial
                            </span>
                            <h1 style={{
                                margin: 0,
                                fontSize: "24px",
                                fontWeight: 700,
                                color: "#2f4238",
                                fontFamily: "'Georgia', serif",
                                letterSpacing: "0.2px",
                            }}>
                                Propuesta Comercial
                            </h1>
                        </td>
                    </tr>

                    {/* Body */}
                    <tr>
                        <td style={{ padding: "32px 32px 24px 32px" }}>
                            <p style={{
                                fontSize: "15px",
                                lineHeight: "1.6",
                                color: "#424240",
                                margin: "0 0 16px 0",
                                fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
                            }}>
                                Estimado(a) <strong style={{ color: "#2f4238" }}>{clienteNombre}</strong>,
                            </p>

                            <p style={{
                                fontSize: "15px",
                                lineHeight: "1.6",
                                color: "#595955",
                                margin: "0 0 24px 0",
                                fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
                            }}>
                                Nos complace presentarle la propuesta formal con el resumen de la oferta ajustada a sus requerimientos actuales.
                            </p>

                            <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%", marginBottom: "28px" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: "48%", backgroundColor: "#f5ece8", borderRadius: "8px", padding: "16px", border: "1px solid #eadeD7", verticalAlign: "top" }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#8a5c4e", letterSpacing: "0.8px", marginBottom: "6px", fontFamily: "'Segoe UI', sans-serif" }}>
                                                Presupuesto Máximo
                                            </div>
                                            <div style={{ fontSize: "18px", fontWeight: 700, color: "#59392e", fontFamily: "'Georgia', serif" }}>
                                                {formatPrice(toNumber(presupuestoMaximo))}
                                            </div>
                                        </td>
                                        <td style={{ width: "4%" }}></td>
                                        <td style={{ width: "48%", backgroundColor: "#eaf0f5", borderRadius: "8px", padding: "16px", border: "1px solid #d8e4f0", verticalAlign: "top" }}>
                                            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#486b8a", letterSpacing: "0.8px", marginBottom: "6px", fontFamily: "'Segoe UI', sans-serif" }}>
                                                Fecha y Hora Límite
                                            </div>
                                            <div style={{ fontSize: "15px", fontWeight: 700, color: "#2e4a63", fontFamily: "'Georgia', serif" }}>
                                                <span>
                                                    {formatDate(safeDate)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {productos.length > 0 && (
                                <>
                                    <h3 style={{
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        color: "#2f4238",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.8px",
                                        margin: "0 0 12px 0",
                                        fontFamily: "'Segoe UI', sans-serif",
                                    }}>
                                        📦 Detalle de Productos
                                    </h3>

                                    <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        marginBottom: "28px",
                                        backgroundColor: "#ffffff",
                                        borderRadius: "6px",
                                        border: "1px solid #e8e3d5",
                                        overflow: "hidden",
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f2efe4", borderBottom: "1px solid #e8e3d5" }}>
                                                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#524e43", fontFamily: "'Segoe UI', sans-serif" }}>Producto</th>
                                                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#524e43", fontFamily: "'Segoe UI', sans-serif", width: "70px" }}>Cant.</th>
                                                <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "12px", fontWeight: 700, color: "#524e43", fontFamily: "'Segoe UI', sans-serif", width: "100px" }}>Precio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productos.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: idx === productos.length - 1 ? "none" : "1px solid #f2efea" }}>
                                                    <td style={{ padding: "12px 14px", fontSize: "13px", color: "#424240", fontFamily: "'Segoe UI', sans-serif" }}>
                                                        {item.producto.nombre}
                                                    </td>
                                                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "13px", color: "#595955", fontFamily: "'Segoe UI', sans-serif" }}>
                                                        {item.cantidad}
                                                    </td>
                                                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: "13px", fontWeight: 600, color: "#3a5747", fontFamily: "'Segoe UI', sans-serif" }}>
                                                        {formatPrice(toNumber(item.precioAcordado))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%", backgroundColor: "#f5f3ee", borderRadius: "6px", padding: "12px 16px", marginBottom: "28px", border: "1px solid #e8e4dc" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: "24px", verticalAlign: "middle", fontSize: "16px" }}>📎</td>
                                        <td style={{ fontSize: "13px", color: "#615c52", fontFamily: "'Segoe UI', sans-serif", verticalAlign: "middle" }}>
                                            Se incluye el documento formal adjunto para su debida validación.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ borderTop: "1px solid #eadeD7", paddingTop: "20px" }}>
                                <p style={{ fontSize: "14px", color: "#595955", margin: "0 0 4px 0", fontFamily: "'Segoe UI', sans-serif" }}>
                                    Quedamos a su entera disposición para cualquier consulta.
                                </p>
                                <p style={{ fontSize: "14px", color: "#595955", margin: "0 0 12px 0", fontFamily: "'Segoe UI', sans-serif" }}>
                                    Atentamente,
                                </p>
                                <p style={{ fontSize: "15px", fontWeight: 700, color: "#2f4238", margin: 0, fontFamily: "'Georgia', serif" }}>
                                    Equipo de Comercialización
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style={{
                            backgroundColor: "#f2efe9",
                            padding: "20px 32px",
                            textAlign: "center",
                            borderTop: "1px solid #e6e2d6",
                            fontSize: "11px",
                            color: "#8c857b",
                            fontFamily: "'Segoe UI', sans-serif",
                            lineHeight: "1.5",
                        }}>
                            <p style={{ margin: 0 }}>
                                Mensaje automático generado por el Sistema de Gestión de Licitaciones.
                            </p>
                            <p style={{ margin: "4px 0 0 0" }}>
                                © {new Date().getFullYear()} — Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}