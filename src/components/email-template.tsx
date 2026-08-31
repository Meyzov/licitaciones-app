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
            fontFamily: "'Georgia', 'Times New Roman', 'Segoe UI', serif",
            maxWidth: "640px",
            margin: "0 auto",
            padding: "16px 12px",
            backgroundColor: "#f5f2ee",
        }}>
            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "24px 18px 20px",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)",
                border: "1px solid #eae5df",
            }}>
                <div style={{
                    backgroundColor: "#f0f7fe",
                    padding: "16px 18px",
                    borderRadius: "12px 12px 0 0",
                    margin: "-24px -18px 0 -18px",
                    borderBottom: "2px solid #e0eaf5",
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#4a5b66",
                        letterSpacing: "0.3px",
                    }}>
                        📄 Propuesta Comercial
                    </h1>
                    <p style={{
                        margin: "4px 0 0 0",
                        fontSize: "14px",
                        color: "#6b7e8c",
                        fontWeight: 400,
                        fontFamily: "'Segoe UI', sans-serif",
                    }}>
                        Sistema de Gestión de Licitaciones
                    </p>
                </div>

                <div style={{ padding: "18px 0 4px" }}>
                    <p style={{
                        fontSize: "16px",
                        lineHeight: 1.6,
                        margin: "0 0 4px 0",
                        color: "#4a4f55",
                    }}>
                        Estimado(a) <strong style={{ color: "#3d5a73", fontWeight: 700 }}>{clienteNombre}</strong>,
                    </p>
                    <p style={{
                        fontSize: "15px",
                        lineHeight: 1.6,
                        margin: "0 0 22px 0",
                        color: "#5a626a",
                        fontFamily: "'Segoe UI', sans-serif",
                    }}>
                        Nos complace presentarle formalmente los detalles de nuestra propuesta comercial.
                        A continuación encontrará el resumen de la oferta:
                    </p>

                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginBottom: "24px",
                    }}>
                        <div style={{
                            flex: "1 1 100%",
                            backgroundColor: "#fef9e7",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            border: "1px solid #f6ecc8",
                        }}>
                            <div style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#8a7a4a",
                                letterSpacing: "0.6px",
                                textTransform: "uppercase",
                                fontFamily: "'Segoe UI', sans-serif",
                            }}>
                                Presupuesto máximo
                            </div>
                            <div style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                color: "#6b5a3a",
                                marginTop: "2px",
                            }}>
                                {formatPrice(toNumber(presupuestoMaximo))}
                            </div>
                        </div>

                        <div style={{
                            flex: "1 1 100%",
                            backgroundColor: "#eaf4f1",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            border: "1px solid #d3e3de",
                        }}>
                            <div style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#3d6b63",
                                letterSpacing: "0.6px",
                                textTransform: "uppercase",
                                fontFamily: "'Segoe UI', sans-serif",
                            }}>
                                Fecha límite
                            </div>
                            <div style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#2e554a",
                                marginTop: "2px",
                            }}>
                                {formatDate(safeDate)}
                            </div>
                        </div>
                    </div>

                    {productos.length > 0 && (
                        <>
                            <h3 style={{
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "#4a5b66",
                                margin: "0 0 12px 0",
                                paddingBottom: "6px",
                                borderBottom: "2px solid #ede8e1",
                                fontFamily: "'Georgia', serif",
                            }}>
                                🛒 Productos incluidos
                            </h3>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "14px",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                                }}>
                                    <thead>
                                        <tr style={{
                                            backgroundColor: "#f4f0f8",
                                            borderBottom: "2px solid #e2dae8",
                                        }}>
                                            <th style={thStyle}>Producto</th>
                                            <th style={{ ...thStyle, textAlign: "center" }}>Cant.</th>
                                            <th style={{ ...thStyle, textAlign: "right" }}>Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productos.map((item, idx) => (
                                            <tr key={idx} style={{
                                                borderBottom: idx === productos.length - 1 ? "none" : "1px solid #eeeae5",
                                                backgroundColor: idx % 2 === 0 ? "#fcfcfb" : "#faf8f6",
                                            }}>
                                                <td style={tdStyle}>{item.producto.nombre}</td>
                                                <td style={{ ...tdStyle, textAlign: "center" }}>{item.cantidad}</td>
                                                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: "#4a6b5a" }}>
                                                    {formatPrice(toNumber(item.precioAcordado))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <div style={{
                        backgroundColor: "#fef3ed",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        borderLeft: "6px solid #f3cfbf",
                        marginTop: "24px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}>
                        <span style={{ fontSize: "20px", marginRight: "10px" }}>📎</span>
                        <p style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#5e4d44",
                            fontFamily: "'Segoe UI', sans-serif",
                            flex: 1,
                        }}>
                            Adjuntamos el <strong>documento de propuesta formal</strong> para su revisión.
                        </p>
                    </div>

                    <div style={{ borderTop: "1px solid #efeae4", paddingTop: "20px", marginTop: "4px" }}>
                        <p style={paragraphStyle}>
                            Quedamos atentos a sus comentarios y a su disposición para cualquier consulta.
                        </p>
                        <p style={paragraphStyle}>Atentamente,</p>
                        <p style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            margin: "8px 0 0 0",
                            color: "#4a5b66",
                            fontFamily: "'Georgia', serif",
                            letterSpacing: "0.3px",
                        }}>
                            Equipo de Comercialización
                        </p>
                    </div>
                </div>

                <div style={{
                    marginTop: "24px",
                    paddingTop: "14px",
                    borderTop: "1px solid #e8e2db",
                    textAlign: "center",
                    color: "#9b9187",
                    fontSize: "11px",
                    lineHeight: 1.5,
                    fontFamily: "'Segoe UI', sans-serif",
                }}>
                    <p style={{ margin: 0 }}>
                        Este es un correo generado automáticamente por el Sistema de Gestión de Licitaciones.
                    </p>
                    <p style={{ margin: "2px 0 0 0" }}>
                        © {new Date().getFullYear()} — Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    textAlign: "left",
    fontWeight: 600,
    color: "#4d4359",
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: "12px",
    letterSpacing: "0.3px",
};

const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    color: "#3d4349",
    fontWeight: 500,
    fontSize: "13px",
};

const paragraphStyle: React.CSSProperties = {
    fontSize: "15px",
    lineHeight: 1.6,
    margin: "0 0 4px 0",
    color: "#5a626a",
    fontFamily: "'Segoe UI', sans-serif",
};