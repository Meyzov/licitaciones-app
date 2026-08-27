"use client";

import React, { useState, useRef } from "react";
import { loginAction } from "./actions";
import styles from "./login.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string) => {
        if (toastTimeoutRef.current) { clearTimeout(toastTimeoutRef.current); }
        setToast(message);

        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
            toastTimeoutRef.current = null;
        },
        4000);
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        const result = await loginAction(new FormData(e.currentTarget as HTMLFormElement));
        if (result?.error) { showToast(result.error); }
    };

    return (
        <main className={styles.container}>
            {toast && (
                <div className={styles.toast}>
                    {toast}
                </div>
            )}

            <div className={styles.paperCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Sistema de Licitaciones</h1>
                    <p className={styles.subtitle}>Ingresa tus credenciales para acceder a la plataforma</p>
                </div>

                <div className={styles.divider} />

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Correo electrónico</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="usuario@ejemplo.com"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            className={styles.paperInput}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>Contraseña</label>
                        <div className={styles.passwordContainer}>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                className={styles.paperInput}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className={styles.sideButton}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#57606a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" y1="2" x2="22" y2="22" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#57606a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={styles.bottomDivider} />

                    <button type="submit" className={styles.paperButton}>
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </main>
    );
}