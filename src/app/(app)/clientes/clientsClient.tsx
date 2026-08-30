"use client";

import { useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useToast } from "@/lib/useToast";
import { FiRefreshCw, FiArrowLeft, FiPlus } from "react-icons/fi";
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
    const [searchTerm, setSearchTerm] = useState("");
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

    const filteredClients = clients.filter((client) =>
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <button className={`${styles.button}`} onClick={() => setIsCreating(false)}>
                            <FiArrowLeft />
                            Volver
                        </button>
                        <div className={styles.titleCard}>Nuevo cliente</div>
                    </div>
                ) : (
                    <>
                        <div className={styles.headerLeft}>
                            <div className={styles.titleCard}>Listado de clientes</div>
                            <button
                                className={styles.button}
                                onClick={handleRefresh}
                                disabled={isLoadingState}
                                title={isLoadingState ? "Cargando..." : "Refrescar"}
                            >
                                <FiRefreshCw
                                    className={`${isLoadingState ? styles.refreshIconSpinning : ""}`}
                                />
                                <span className={styles.refreshButtonText}>
                                    {isLoadingState ? "Cargando..." : "Refrescar"}
                                </span>
                            </button>
                        </div>

                        <button className={`${styles.button} ${styles.buttonSuccess}`} onClick={() => setIsCreating(true)}>
                            <FiPlus />
                            Nuevo cliente
                        </button>
                    </>
                )}
            </div>

            {!isCreating && (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo electrónico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.formInput}
                    />
                </div>
            )}

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
                            className={`${styles.button} ${styles.buttonDanger}`}
                            onClick={() => setIsCreating(false)}
                            disabled={isMutating} >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="client-form"
                            className={`${styles.button} ${styles.buttonSuccess}`}
                            disabled={isMutating} >
                            {isMutating ? "Guardando..." : "Guardar cliente"}
                        </button>
                    </div>
                </>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollWrapper}>
                        <div className={styles.tableHeader} role="row">
                            <span>Nombre</span>
                            <span>Email</span>
                            <span>Modificado por</span>
                            <span>Modificado el</span>
                            <span>Creado por</span>
                            <span>Creado el</span>
                        </div>

                        <div key={animKey} className={styles.clientList}>
                            {filteredClients.length > 0 ? (
                                filteredClients.map((client, index) => (
                                    <div
                                        key={client.id}
                                        className={`${styles.clientRow} ${styles.animatedRow}`}
                                        role="row"
                                        style={{ "--index": index } as React.CSSProperties} >
                                        <div className={styles.cellNombre}>
                                            <div className={styles.clientIdentity}>
                                                <span className={styles.avatar}>
                                                    {client.nombre.charAt(0).toUpperCase()}
                                                </span>
                                                <span className={styles.clientName}>{client.nombre}</span>
                                            </div>
                                        </div>

                                        <div className={styles.cellEmail}>
                                            <span className={styles.clientEmail}>{client.email}</span>
                                        </div>

                                        <div className={styles.cellModificadoPor}>
                                            <span className={styles.metaText}>
                                                {client.modificador ? client.modificador.nombre : "No modificado"}
                                            </span>
                                        </div>

                                        <div className={styles.cellModificadoEl}>
                                            <span className={styles.metaText}>
                                                {client.updatedAt ? formatDate(client.updatedAt) : "Sin modificar"}
                                            </span>
                                        </div>

                                        <div className={styles.cellCreadoPor}>
                                            <span className={styles.metaText}>{client.creador.nombre}</span>
                                        </div>

                                        <div className={styles.cellCreadoEl}>
                                            <span className={styles.dateText}>{formatDate(client.createdAt)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: "24px", textAlign: "center", color: "#8a8375", fontSize: "13px" }}>
                                    No se encontraron clientes que coincidan con la búsqueda.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}