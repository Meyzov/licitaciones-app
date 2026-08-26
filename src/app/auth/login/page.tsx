"use client";

import React, { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        alert(`Intento de login con:\nEmail: ${email}\nPassword: ${password}`);
    };

    return (
        <main style={styles.container}>
            <div style={styles.paperCard}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Sistema de Licitaciones</h1>
                    <p style={styles.subtitle}>
                        Ingresa tus credenciales para acceder a la plataforma
                    </p>
                </div>

                <div style={styles.divider} />

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.label}>
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="usuario@ejemplo.com"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEmail(e.target.value)
                            }
                            style={styles.paperInput}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="password" style={styles.label}>
                            Contraseña
                        </label>
                        <div style={styles.passwordContainer}>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPassword(e.target.value)
                                }
                                style={styles.paperInput}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.sideButton}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#57606a"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" y1="2" x2="22" y2="22" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#57606a"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={styles.bottomDivider} />

                    <button type="submit" style={styles.paperButton}>
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f3ef",
        padding: "20px",
        boxSizing: "border-box",
    },
    paperCard: {
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#fcfbf9",
        padding: "40px 36px",
        borderRadius: "8px",
        border: "1px solid #e2ded4",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02), 0 8px 16px rgba(0, 0, 0, 0.03)",
        boxSizing: "border-box",
    },
    header: {
        textAlign: "center",
    },
    title: {
        fontSize: "22px",
        fontWeight: "600",
        color: "#2c302e",
        margin: "0 0 8px 0",
        letterSpacing: "-0.3px",
    },
    subtitle: {
        fontSize: "13px",
        color: "#6e7471",
        margin: 0,
        lineHeight: "1.4",
    },
    divider: {
        height: "1px",
        backgroundColor: "#ece8df",
        margin: "24px 0",
        width: "100%",
    },
    bottomDivider: {
        height: "1px",
        backgroundColor: "#ece8df",
        margin: "4px 0 24px 0",
        width: "100%",
    },
    form: {
        display: "flex",
        flexDirection: "column",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginBottom: "20px",
    },
    label: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#474d4a",
        letterSpacing: "0.2px",
    },
    paperInput: {
        width: "100%",
        height: "44px",
        padding: "0 14px",
        borderRadius: "6px",
        border: "1px solid #dcd7cc",
        fontSize: "14px",
        color: "#2c302e",
        outline: "none",
        backgroundColor: "#f7f5f0",
        boxSizing: "border-box",
    },
    passwordContainer: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        width: "100%",
    },
    sideButton: {
        height: "44px",
        width: "44px",
        minWidth: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f7f5f0",
        border: "1px solid #dcd7cc",
        borderRadius: "6px",
        cursor: "pointer",
        padding: "0",
        boxSizing: "border-box",
    },
    paperButton: {
        height: "44px",
        width: "100%",
        backgroundColor: "#3a5a40",
        color: "#fcfbf9",
        border: "1px solid #2d4732",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(58, 90, 64, 0.15)",
    },
};