interface EmailReminderProps {
    clienteNombre: string;
    fechaLimite: Date | string;
    formatDate: (date: Date) => string;
}

export function EmailReminderTemplate({
    clienteNombre,
    fechaLimite,
    formatDate,
}: EmailReminderProps) {
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
                    backgroundColor: "#fef3ed",
                    padding: "16px 18px",
                    borderRadius: "12px 12px 0 0",
                    margin: "-24px -18px 0 -18px",
                    borderBottom: "2px solid #f3cfbf",
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#7a4a3a",
                        letterSpacing: "0.3px",
                    }}>
                        ⏰ Recordatorio Urgente
                    </h1>
                    <p style={{
                        margin: "4px 0 0 0",
                        fontSize: "14px",
                        color: "#9b6b5a",
                        fontWeight: 400,
                        fontFamily: "'Segoe UI', sans-serif",
                    }}>
                        Su licitación está próxima a vencer
                    </p>
                </div>

                <div style={{ padding: "18px 0 4px" }}>
                    <p style={{
                        fontSize: "16px",
                        lineHeight: 1.6,
                        margin: "0 0 16px 0",
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
                        Le recordamos que la fecha límite para responder a nuestra propuesta comercial está muy próxima.
                        Por favor, revise la documentación enviada anteriormente y envíe su respuesta a la brevedad.
                    </p>

                    <div style={{
                        backgroundColor: "#fff5f5",
                        borderRadius: "10px",
                        padding: "16px 18px",
                        border: "1px solid #f5d5d5",
                        marginBottom: "24px",
                        textAlign: "center",
                    }}>
                        <div style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#8a4a4a",
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                            fontFamily: "'Segoe UI', sans-serif",
                        }}>
                            Fecha límite de respuesta
                        </div>
                        <div style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#a04040",
                            marginTop: "6px",
                        }}>
                            {formatDate(safeDate)}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: "#eaf4f1",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        borderLeft: "6px solid #b8d8cf",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}>
                        <span style={{ fontSize: "20px", marginRight: "10px" }}>📄</span>
                        <p style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#3d5a50",
                            fontFamily: "'Segoe UI', sans-serif",
                            flex: 1,
                        }}>
                            Si no ha recibido el documento de propuesta o tiene alguna duda, por favor contáctenos de inmediato.
                        </p>
                    </div>

                    <div style={{ borderTop: "1px solid #efeae4", paddingTop: "20px", marginTop: "4px" }}>
                        <p style={{
                            fontSize: "15px",
                            lineHeight: 1.6,
                            margin: "0 0 4px 0",
                            color: "#5a626a",
                            fontFamily: "'Segoe UI', sans-serif",
                        }}>
                            Quedamos atentos a su respuesta.
                        </p>
                        <p style={{
                            fontSize: "15px",
                            lineHeight: 1.6,
                            margin: "0",
                            color: "#5a626a",
                            fontFamily: "'Segoe UI', sans-serif",
                        }}>
                            Atentamente,
                        </p>
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