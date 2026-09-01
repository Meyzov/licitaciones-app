"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import {
    FiArrowLeft,
    FiUser,
    FiMail,
    FiLock,
    FiShield,
} from "react-icons/fi";

import { useToast } from "@/lib/useToast";

import styles from "./userDetailClient.module.css";

// --- Types ---
type User = {
    id: string;
    nombre: string;
    email: string;
    rol: "admin" | "user";
};

type UpdateUserData = {
    email?: string;
    password?: string;
};

type UserDetailClientProps = {
    userId: string;
};

// --- Fetchers ---
const fetcher = async (url: string): Promise<User> => {
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Error al obtener el usuario.",
        );
    }

    return data;
};

const updateUserFetcher = async (
    url: string,
    { arg }: { arg: UpdateUserData },
) => {
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Error al actualizar el usuario.",
        );
    }

    return data;
};

// --- Hooks ---
const useIsMounted = () => {
    return useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );
};

// --- Edit Form ---
function UserEditForm({
    user,
    onCancel,
    onSuccess,
}: {
    user: User;
    onCancel: () => void;
    onSuccess: () => void;
}) {
    const { toast, showToast } = useToast();

    const [formData, setFormData] = useState({
        email: user.email,
        password: "",
    });

    const {
        trigger: updateUser,
        isMutating,
    } = useSWRMutation(
        `/api/usuarios/${user.id}`,
        updateUserFetcher,
    );

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (
        e: React.SyntheticEvent<HTMLFormElement>,
    ) => {
        e.preventDefault();

        const dataToUpdate: UpdateUserData = {};

        if (formData.email.trim() !== user.email) {
            dataToUpdate.email = formData.email.trim();
        }

        if (formData.password.trim()) {
            dataToUpdate.password = formData.password;
        }

        if (
            dataToUpdate.email === undefined &&
            dataToUpdate.password === undefined
        ) {
            showToast(
                "No hay cambios para guardar.",
                "error",
            );

            return;
        }

        try {
            await updateUser(dataToUpdate);

            showToast(
                "Información actualizada exitosamente.",
                "success",
            );

            setTimeout(() => {
                onSuccess();
            }, 800);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Error desconocido.";

            showToast(errorMessage, "error");
        }
    };

    const roleLabel = user.rol === "admin"
        ? "Administrador"
        : "Usuario";

    const accountItems = [
        {
            icon: <FiUser />,
            label: "Nombre",
            value: user.nombre,
        },
        {
            icon: <FiShield />,
            label: "Rol",
            value: roleLabel,
        },
        {
            icon: <FiMail />,
            label: "Correo actual",
            value: user.email,
        },
        {
            icon: <FiLock />,
            label: "Contraseña",
            value: "Protegida",
        },
    ];

    return (
        <>
            {toast && (
                <div
                    key={toast.id}
                    className={`${styles.toast} ${styles[`toast_${toast.type}`]
                        }`}
                >
                    {toast.message}
                </div>
            )}

            <div className={styles.content}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <div className={styles.formHeaderIcon}>
                            <FiUser />
                        </div>

                        <div>
                            <div className={styles.formTitle}>
                                Información de la cuenta
                            </div>

                            <div className={styles.formDescription}>
                                Modifica únicamente el correo y la contraseña
                                de tu cuenta.
                            </div>
                        </div>
                    </div>

                    <form
                        id="user-edit-form"
                        onSubmit={handleSubmit}
                        className={styles.formContainer}
                    >
                        <div className={styles.formGroup}>
                            <label
                                htmlFor="email"
                                className={styles.formLabel}
                            >
                                Correo electrónico
                            </label>

                            <div className={styles.inputWithIcon}>
                                <FiMail />

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="correo@empresa.com"
                                    className={styles.formInput}
                                    required
                                    disabled={isMutating}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label
                                htmlFor="password"
                                className={styles.formLabel}
                            >
                                Nueva contraseña
                            </label>

                            <div className={styles.inputWithIcon}>
                                <FiLock />

                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Dejar vacío para conservarla"
                                    className={styles.formInput}
                                    minLength={8}
                                    disabled={isMutating}
                                />
                            </div>

                            <span className={styles.formHint}>
                                La contraseña debe tener al menos 8 caracteres.
                                Déjala vacía si no deseas cambiarla.
                            </span>
                        </div>
                    </form>
                </div>

                <div className={styles.accountSection}>
                    <div className={styles.accountGrid}>
                        {accountItems.map((item, index) => (
                            <div
                                key={index}
                                className={styles.accountItemCard}
                            >
                                <div
                                    className={styles.accountItemIcon}
                                >
                                    {item.icon}
                                </div>

                                <div
                                    className={styles.accountItemBody}
                                >
                                    <span
                                        className={
                                            styles.accountItemLabel
                                        }
                                    >
                                        {item.label}
                                    </span>

                                    <span
                                        className={
                                            styles.accountItemValue
                                        }
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.formActions}>
                <button
                    type="button"
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={onCancel}
                    disabled={isMutating}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="user-edit-form"
                    className={`${styles.button} ${styles.buttonSuccess}`}
                    disabled={isMutating}
                >
                    {isMutating
                        ? "Guardando..."
                        : "Guardar cambios"}
                </button>
            </div>
        </>
    );
}

// --- Main Component ---
export default function UserDetailClient({
    userId,
}: UserDetailClientProps) {
    const router = useRouter();

    const isMounted = useIsMounted();

    const {
        data: user,
        error,
        isLoading,
    } = useSWR<User>(
        isMounted ? `/api/usuarios/${userId}` : null,
        fetcher,
    );

    const handleGoBack = () => {
        router.push("/usuarios");
    };

    if (!isMounted || isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner} />

                    <span>
                        Cargando información de la cuenta...
                    </span>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className={styles.secondaryCard}>
                <div className={styles.errorState}>
                    <div className={styles.errorTitle}>
                        No se pudo cargar la información
                    </div>

                    <div className={styles.errorMessage}>
                        {error instanceof Error
                            ? error.message
                            : "Usuario no encontrado."}
                    </div>

                    <button
                        type="button"
                        className={styles.button}
                        onClick={handleGoBack}
                    >
                        <FiArrowLeft />
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.secondaryCard}>
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <button
                        type="button"
                        className={styles.button}
                        onClick={handleGoBack}
                    >
                        <FiArrowLeft />
                        Volver
                    </button>

                    <div className={styles.titleCard}>
                        Editar cuenta
                    </div>
                </div>
            </div>

            <UserEditForm
                user={user}
                onCancel={handleGoBack}
                onSuccess={handleGoBack}
            />
        </div>
    );
}