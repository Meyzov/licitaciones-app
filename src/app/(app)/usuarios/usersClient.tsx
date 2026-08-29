"use client";

import { useState, useSyncExternalStore, useRef, useEffect } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useToast } from "@/lib/useToast";
import styles from "./usersClient.module.css";

type User = {
    id: string;
    nombre: string;
    email: string;
    rol: string;
};

const roleLabels: Record<string, string> = {
    admin: "Administrador",
    user: "Usuario",
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
});

const mutationFetcher = async (url: string, { arg }: { arg: { name: string; email: string; password: string; role: string } }) => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al crear el usuario");
    }

    return data;
};

const useIsMounted = () => {
    return useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );
};

function RefreshIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    );
}

type UsersClientProps = {
    isAdmin: boolean;
};

export default function UsersClient({ isAdmin }: UsersClientProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const isMounted = useIsMounted();
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { toast, showToast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsRoleOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { data: users = [], isValidating, mutate: refreshUsers } = useSWR<User[]>(
        isMounted ? "/api/usuarios" : null,
        fetcher
    );

    const { trigger: createUser, isMutating } = useSWRMutation("/api/usuarios", mutationFetcher);

    const isLoadingState = isMounted ? isValidating : false;

    const handleRefresh = async () => {
        await refreshUsers();
        setAnimKey((prev) => prev + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitUser = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await createUser(formData);

            setFormData({
                name: "",
                email: "",
                password: "",
                role: "user",
            });

            setIsCreating(false);
            await refreshUsers();
            setAnimKey((prev) => prev + 1);
            showToast("Usuario creado exitosamente", "success");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            showToast(errorMessage, "error");
        }
    };

    return (
        <div className={styles.secondaryCard}>
            {toast && (
                <div key={toast.id} className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    {toast.message}
                </div>
            )}

            <div className={styles.cardHeader}>
                {isCreating ? (
                    <div className={styles.headerLeft}>
                        <button className={styles.button} onClick={() => setIsCreating(false)}>
                            ← Volver
                        </button>
                        <div className={styles.titleCard}>Nuevo usuario</div>
                    </div>
                ) : (
                    <>
                        <div className={styles.headerLeft}>
                            <div className={styles.titleCard}>Listado de usuarios</div>
                            <button
                                className={styles.button}
                                onClick={handleRefresh}
                                disabled={isLoadingState}
                                title={isLoadingState ? "Cargando..." : "Refrescar"}
                            >
                                <RefreshIcon
                                    className={`${styles.refreshIcon} ${isLoadingState ? styles.refreshIconSpinning : ""}`}
                                />
                                <span className={styles.refreshButtonText}>
                                    {isLoadingState ? "Cargando..." : "Refrescar"}
                                </span>
                            </button>
                        </div>

                        {isAdmin && (
                            <button className={styles.button} onClick={() => setIsCreating(true)}>
                                + Nuevo usuario
                            </button>
                        )}
                    </>
                )}
            </div>

            {isCreating ? (
                <>
                    <div className={styles.formCard}>
                        <form
                            id="user-form"
                            onSubmit={handleSubmitUser}
                            className={styles.formContainer} >
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Meyzov"
                                    className={styles.formInput}
                                    required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Correo electrónico</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="correo@ejemplo.com"
                                    className={styles.formInput}
                                    required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className={styles.formInput}
                                    required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Rol del sistema</label>
                                <div className={styles.customSelectWrapper} ref={dropdownRef}>
                                    <div
                                        className={styles.customSelectTrigger}
                                        onClick={() => setIsRoleOpen(!isRoleOpen)} >
                                        <span>{roleLabels[formData.role]}</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ transform: isRoleOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>

                                    {isRoleOpen && (
                                        <div className={styles.customDropdownList}>
                                            <div
                                                className={`${styles.customDropdownItem} ${formData.role === "user" ? styles.selected : ""}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, role: "user" });
                                                    setIsRoleOpen(false);
                                                }} >
                                                Usuario
                                            </div>
                                            <div
                                                className={`${styles.customDropdownItem} ${formData.role === "admin" ? styles.selected : ""}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, role: "admin" });
                                                    setIsRoleOpen(false);
                                                }} >
                                                Administrador
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={() => setIsCreating(false)}
                            disabled={isMutating} >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="user-form"
                            className={styles.button}
                            disabled={isMutating} >
                            {isMutating ? "Guardando..." : "Guardar usuario"}
                        </button>
                    </div>
                </>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollWrapper}>
                        <div className={styles.tableHeader} role="row">
                            <span>Nombre</span>
                            <span>Email</span>
                            <span>Rol</span>
                        </div>

                        <div key={animKey} className={styles.userList}>
                            {users.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={`${styles.userRow} ${styles.animatedRow}`}
                                    role="row"
                                    style={{ "--index": index } as React.CSSProperties} >
                                    <div className={styles.cellNombre}>
                                        <div className={styles.userIdentity}>
                                            <span className={styles.avatar}>
                                                {user.nombre.charAt(0).toUpperCase()}
                                            </span>
                                            <span className={styles.userName}>{user.nombre}</span>
                                        </div>
                                    </div>

                                    <div className={styles.cellEmail}>
                                        <span className={styles.userEmail}>{user.email}</span>
                                    </div>

                                    <div className={styles.cellRol}>
                                        <span className={`${styles.badge} ${styles[`badge_${user.rol}`]}`}>
                                            {roleLabels[user.rol] ?? user.rol}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}