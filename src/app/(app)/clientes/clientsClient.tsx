"use client";

import { useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useToast } from "@/lib/useToast";
import styles from "./clientsClient.module.css";

type Client = {
    id: string;
    nombre: string;
    email: string;
    createdAt: string;
    updatedAt: string | null;
    creador: { nombre: string };
    modificador: { nombre: string } | null;
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch clients");
    return res.json();
});

const mutationFetcher = async (url: string, { arg }: { arg: { name: string; email: string } }) => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al crear el cliente");
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

const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function ClientsClient() {
    const [isCreating, setIsCreating] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const isMounted = useIsMounted();
    const { toast, showToast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    const { data: clients = [], isValidating, mutate: refreshClients } = useSWR<Client[]>(
        isMounted ? "/api/clientes" : null,
        fetcher
    );

    const { trigger: createClient, isMutating } = useSWRMutation("/api/clientes", mutationFetcher);

    const isLoadingState = isMounted ? isValidating : false;

    const handleRefresh = async () => {
        await refreshClients();
        setAnimKey((prev) => prev + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitClient = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await createClient(formData);

            setFormData({ name: "", email: "" });
            setIsCreating(false);
            await refreshClients();
            setAnimKey((prev) => prev + 1);
            showToast("Cliente creado exitosamente", "success");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            showToast(errorMessage, "error");
        }
    };

    return (
        <div className={styles.baseCard}>
            {toast && (
                <div key={toast.id} className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    {toast.message}
                </div>
            )}

            <div className={styles.secondaryCard}>
                <div className={styles.cardHeader}>
                    {isCreating ? (
                        <div className={styles.headerLeft}>
                            <button className={styles.button} onClick={() => setIsCreating(false)}>
                                ← Volver
                            </button>
                            <div className={styles.titleCard}>Nuevo cliente</div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.headerLeft}>
                                <div className={styles.titleCard}>Listado de clientes</div>
                                <button className={styles.button} onClick={handleRefresh} disabled={isLoadingState}>
                                    {isLoadingState ? "Cargando..." : "Refrescar"}
                                </button>
                            </div>

                            <button className={styles.button} onClick={() => setIsCreating(true)}>
                                + Nuevo cliente
                            </button>
                        </>
                    )}
                </div>

                {isCreating ? (
                    <>
                        <div className={styles.formCard}>
                            <form
                                id="client-form"
                                onSubmit={handleSubmitClient}
                                className={styles.formContainer} >
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nombre del cliente</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Constructora Delta"
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
                                        placeholder="contacto@empresa.com"
                                        className={styles.formInput}
                                        required />
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
                                form="client-form"
                                className={styles.button}
                                disabled={isMutating} >
                                {isMutating ? "Guardando..." : "Guardar cliente"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableHeader} role="row">
                            <span>Nombre</span>
                            <span>Email</span>
                            <span>Creado por</span>
                            <span>Modificado por</span>
                            <span className={styles.alignRight}>Registrado</span>
                        </div>

                        <div key={animKey} className={styles.clientList}>
                            {clients.map((client, index) => (
                                <div
                                    key={client.id}
                                    className={`${styles.clientRow} ${styles.animatedRow}`}
                                    role="row"
                                    style={{ "--index": index } as React.CSSProperties} >
                                    <div className={styles.clientIdentity}>
                                        <span className={styles.avatar}>
                                            {client.nombre.charAt(0).toUpperCase()}
                                        </span>
                                        <span className={styles.clientName}>{client.nombre}</span>
                                    </div>

                                    <span className={styles.clientEmail}>{client.email}</span>

                                    <span className={styles.metaText}>{client.creador.nombre}</span>

                                    <span className={styles.metaText}>
                                        {client.modificador ? client.modificador.nombre : "No modificado"}
                                    </span>

                                    <div className={styles.alignRight}>
                                        <span className={styles.dateText}>{formatDate(client.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}