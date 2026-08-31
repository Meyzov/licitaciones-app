"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import {
    FiArrowLeft,
    FiUser,
    FiUserPlus,
    FiCalendar,
    FiEdit3,
    FiClock,
} from "react-icons/fi";

import { useToast } from "@/lib/useToast";

import styles from "./clientDetailClient.module.css";

// --- Types ---
type Client = {
    id: string;
    nombre: string;
    email: string;
    createdAt: string;
    updatedAt: string | null;
    creador: {
        nombre: string;
    };
    modificador: {
        nombre: string;
    } | null;
};

type ClientDetailClientProps = {
    clientId: string;
};

type UpdateClientData = {
    name: string;
    email: string;
};

// --- Fetchers ---
const fetcher = async (url: string): Promise<Client> => {
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Error al obtener el cliente.",
        );
    }

    return data;
};

const updateClientFetcher = async (
    url: string,
    { arg }: { arg: UpdateClientData },
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
            data.error || "Error al actualizar el cliente.",
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

// --- Formatters ---
const formatDate = (isoDate: string | null) => {
    if (!isoDate) {
        return "Sin modificar";
    }

    const date = new Date(isoDate);

    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
};

// --- Edit Form ---
function ClientEditForm({
    client,
    onCancel,
    onSuccess,
}: {
    client: Client;
    onCancel: () => void;
    onSuccess: () => void;
}) {
    const { toast, showToast } = useToast();

    const [formData, setFormData] = useState({
        name: client.nombre,
        email: client.email,
    });

    const {
        trigger: updateClient,
        isMutating,
    } = useSWRMutation(
        `/api/clientes/${client.id}`,
        updateClientFetcher,
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

        try {
            await updateClient(formData);

            showToast(
                "Cliente actualizado exitosamente",
                "success",
            );

            setTimeout(() => {
                onSuccess();
            }, 800);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Error desconocido";

            showToast(errorMessage, "error");
        }
    };

    const auditItems = [
        {
            icon: <FiUserPlus />,
            label: "Creado por",
            value: client.creador.nombre,
        },
        {
            icon: <FiCalendar />,
            label: "Creado el",
            value: formatDate(client.createdAt),
        },
        {
            icon: <FiEdit3 />,
            label: "Modificado por",
            value: client.modificador
                ? client.modificador.nombre
                : "No modificado",
        },
        {
            icon: <FiClock />,
            label: "Modificado el",
            value: formatDate(client.updatedAt),
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
                                Información del cliente
                            </div>

                            <div className={styles.formDescription}>
                                Modifica los datos principales del cliente.
                            </div>
                        </div>
                    </div>

                    <form
                        id="client-edit-form"
                        onSubmit={handleSubmit}
                        className={styles.formContainer}
                    >
                        <div className={styles.formGroup}>
                            <label
                                htmlFor="name"
                                className={styles.formLabel}
                            >
                                Nombre del cliente
                            </label>

                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Ej. Constructora Delta"
                                className={styles.formInput}
                                required
                                disabled={isMutating}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label
                                htmlFor="email"
                                className={styles.formLabel}
                            >
                                Correo electrónico
                            </label>

                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="contacto@empresa.com"
                                className={styles.formInput}
                                required
                                disabled={isMutating}
                            />
                        </div>
                    </form>
                </div>

                <div className={styles.auditSection}>
                    <div className={styles.auditGrid}>
                        {auditItems.map((item, index) => (
                            <div
                                key={index}
                                className={styles.auditItemCard}
                            >
                                <div
                                    className={styles.auditItemIcon}
                                >
                                    {item.icon}
                                </div>

                                <div
                                    className={styles.auditItemBody}
                                >
                                    <span
                                        className={
                                            styles.auditItemLabel
                                        }
                                    >
                                        {item.label}
                                    </span>

                                    <span
                                        className={
                                            styles.auditItemValue
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
                    form="client-edit-form"
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
export default function ClientDetailClient({
    clientId,
}: ClientDetailClientProps) {
    const router = useRouter();

    const isMounted = useIsMounted();

    const {
        data: client,
        error,
        isLoading,
    } = useSWR<Client>(
        isMounted ? `/api/clientes/${clientId}` : null,
        fetcher,
    );

    const handleGoBack = () => {
        router.push("/clientes");
    };

    if (!isMounted || isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner} />

                    <span>Cargando cliente...</span>
                </div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className={styles.secondaryCard}>
                <div className={styles.errorState}>
                    <div className={styles.errorTitle}>
                        No se pudo cargar el cliente
                    </div>

                    <div className={styles.errorMessage}>
                        {error instanceof Error
                            ? error.message
                            : "Cliente no encontrado."}
                    </div>

                    <button
                        type="button"
                        className={styles.button}
                        onClick={handleGoBack}
                    >
                        <FiArrowLeft />
                        Volver a clientes
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
                        Editar cliente
                    </div>
                </div>
            </div>

            <ClientEditForm
                client={client}
                onCancel={handleGoBack}
                onSuccess={handleGoBack}
            />
        </div>
    );
}