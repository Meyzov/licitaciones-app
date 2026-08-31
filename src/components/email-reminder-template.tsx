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
                            backgroundColor: "#faede8",
                            padding: "28px 32px",
                            textAlign: "center",
                            borderBottom: "1px solid #ebd8d0",
                        }}>
                            <span style={{
                                display: "inline-block",
                                backgroundColor: "#ffffff",
                                color: "#8a4a3a",
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "1.5px",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                marginBottom: "12px",
                                border: "1px solid #f2cfc9",
                            }}>
                                Aviso Urgente
                            </span>
                            <h1 style={{
                                margin: 0,
                                fontSize: "24px",
                                fontWeight: 700,
                                color: "#5e3428",
                                fontFamily: "'Georgia', serif",
                                letterSpacing: "0.2px",
                            }}>
                                Recordatorio de Licitación
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
                                Estimado(a) <strong style={{ color: "#5e3428" }}>{clienteNombre}</strong>,
                            </p>

                            <p style={{
                                fontSize: "15px",
                                lineHeight: "1.6",
                                color: "#595955",
                                margin: "0 0 24px 0",
                                fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
                            }}>
                                Le recordamos que el plazo límite para responder a nuestra propuesta comercial está próximo a vencer. Le sugerimos revisar la documentación enviada y remitir su contestación oportunamente.
                            </p>

                            <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%", marginBottom: "28px" }}>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            backgroundColor: "#fcf2f0",
                                            borderRadius: "8px",
                                            padding: "20px",
                                            border: "1px solid #f0ded8",
                                            textAlign: "center",
                                        }}>
                                            <div style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                color: "#9e5346",
                                                letterSpacing: "0.8px",
                                                marginBottom: "6px",
                                                fontFamily: "'Segoe UI', sans-serif",
                                            }}>
                                                Fecha y Hora Límite de Respuesta
                                            </div>
                                            <div style={{
                                                fontSize: "19px",
                                                fontWeight: 700,
                                                color: "#7d382c",
                                                fontFamily: "'Georgia', serif",
                                            }}>
                                                <span>
                                                    {formatDate(safeDate)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%", backgroundColor: "#f5f3ee", borderRadius: "6px", padding: "12px 16px", marginBottom: "28px", border: "1px solid #e8e4dc" }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: "24px", verticalAlign: "middle", fontSize: "16px" }}>ℹ️</td>
                                        <td style={{ fontSize: "13px", color: "#615c52", fontFamily: "'Segoe UI', sans-serif", verticalAlign: "middle" }}>
                                            Si ya ha enviado su respuesta o cuenta con alguna duda, por favor haga caso omiso de este recordatorio o contáctenos directamente.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ borderTop: "1px solid #eadeD7", paddingTop: "20px" }}>
                                <p style={{ fontSize: "14px", color: "#595955", margin: "0 0 4px 0", fontFamily: "'Segoe UI', sans-serif" }}>
                                    Quedamos atentos a su pronta respuesta.
                                </p>
                                <p style={{ fontSize: "14px", color: "#595955", margin: "0 0 12px 0", fontFamily: "'Segoe UI', sans-serif" }}>
                                    Atentamente,
                                </p>
                                <p style={{ fontSize: "15px", fontWeight: 700, color: "#5e3428", margin: 0, fontFamily: "'Georgia', serif" }}>
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