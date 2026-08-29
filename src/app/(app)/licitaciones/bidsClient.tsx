"use client";

import { useState, useSyncExternalStore, useMemo } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useToast } from "@/lib/useToast";
import styles from "./bidsClient.module.css";

type Bid = {
    id: string;
    presupuestoMaximo: string;
    fechaLimite: string;
    estado: string;
    createdAt: string;
    updatedAt: string | null;
    cliente: { id: string; nombre: string };
    creador: { nombre: string };
    modificador: { nombre: string } | null;
};

type Client = {
    id: string;
    nombre: string;
    email: string;
};

type View = "list" | "create" | "selectClient";

const stateLabels: Record<string, string> = {
    borrador: "Borrador",
    activa: "Activa",
    finalizada: "Finalizada",
    por_cobrar: "Por cobrar",
    cobrada: "Cobrada",
    perdida: "Perdida",
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
});

const mutationFetcher = async (url: string, { arg }: { arg: { clientId: string; maxBudget: string; deadline: string } }) => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al crear la licitación");
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

const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(price));
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

function CalendarIcon({ className }: { className?: string }) {
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

export default function BidsClient() {
    const [view, setView] = useState<View>("list");
    const [animKey, setAnimKey] = useState(0);
    const isMounted = useIsMounted();
    const { toast, showToast } = useToast();
    const [clientSearch, setClientSearch] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        maxBudget: "",
        deadline: "",
    });

    const { data: bids = [], isValidating, mutate: refreshBids } = useSWR<Bid[]>(
        isMounted ? "/api/licitaciones" : null,
        fetcher
    );

    const { data: clients = [] } = useSWR<Client[]>(
        isMounted && view === "selectClient" ? "/api/clientes" : null,
        fetcher
    );

    const { trigger: createBid, isMutating } = useSWRMutation("/api/licitaciones", mutationFetcher);

    const isLoadingState = isMounted ? isValidating : false;

    const filteredClients = useMemo(() => {
        if (!clientSearch.trim()) return clients;
        const query = clientSearch.trim().toLowerCase();
        return clients.filter((client) => client.nombre.toLowerCase().startsWith(query));
    }, [clients, clientSearch]);

    const handleRefresh = async () => {
        await refreshBids();
        setAnimKey((prev) => prev + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setClientSearch("");
        setView("create");
    };

    const handleStartCreating = () => {
        setSelectedClient(null);
        setFormData({ maxBudget: "", deadline: "" });
        setView("create");
    };

    const handleSubmitBid = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedClient) {
            showToast("Debes seleccionar un cliente", "error");
            return;
        }

        try {
            await createBid({ ...formData, clientId: selectedClient.id });

            setFormData({ maxBudget: "", deadline: "" });
            setSelectedClient(null);
            setView("list");
            await refreshBids();
            setAnimKey((prev) => prev + 1);
            showToast("Licitación creada exitosamente", "success");
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
                {view === "list" && (
                    <>
                        <div className={styles.headerLeft}>
                            <div className={styles.titleCard}>Listado de licitaciones</div>
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

                        <button className={styles.button} onClick={handleStartCreating}>
                            + Nueva licitación
                        </button>
                    </>
                )}

                {view === "create" && (
                    <div className={styles.headerLeft}>
                        <button className={styles.button} onClick={() => setView("list")}>
                            ← Volver
                        </button>
                        <div className={styles.titleCard}>Nueva licitación</div>
                    </div>
                )}

                {view === "selectClient" && (
                    <div className={styles.headerLeft}>
                        <button className={styles.button} onClick={() => setView("create")}>
                            ← Volver
                        </button>
                        <div className={styles.titleCard}>Seleccionar cliente</div>
                    </div>
                )}
            </div>

            {view === "create" && (
                <>
                    <div className={styles.formCard}>
                        <form
                            id="bid-form"
                            onSubmit={handleSubmitBid}
                            className={styles.formContainer} >
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Cliente</label>
                                <button
                                    type="button"
                                    className={styles.clientPickerButton}
                                    onClick={() => setView("selectClient")} >
                                    {selectedClient ? (
                                        <span className={styles.clientPickerSelected}>
                                            <span className={styles.avatarSmall}>
                                                {selectedClient.nombre.charAt(0).toUpperCase()}
                                            </span>
                                            {selectedClient.nombre}
                                        </span>
                                    ) : (
                                        <span className={styles.clientPickerPlaceholder}>
                                            Buscar cliente...
                                        </span>
                                    )}
                                    <span className={styles.clientPickerIcon}>→</span>
                                </button>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Presupuesto máximo</label>
                                <input
                                    type="number"
                                    name="maxBudget"
                                    value={formData.maxBudget}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0.01"
                                    className={styles.formInput}
                                    required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Fecha límite</label>
                                <div className={styles.datePickerWrapper}>
                                    <CalendarIcon className={styles.datePickerIcon} />
                                    <input
                                        type="datetime-local"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleInputChange}
                                        className={`${styles.formInput} ${styles.dateInput}`}
                                        required />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={() => setView("list")}
                            disabled={isMutating} >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="bid-form"
                            className={styles.button}
                            disabled={isMutating} >
                            {isMutating ? "Guardando..." : "Guardar licitación"}
                        </button>
                    </div>
                </>
            )}

            {view === "selectClient" && (
                <div className={styles.tableCard}>
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            placeholder="Buscar cliente por nombre..."
                            className={styles.searchInput}
                            autoFocus />
                    </div>

                    <div className={styles.clientPickList}>
                        {filteredClients.length === 0 ? (
                            <div className={styles.emptyState}>No se encontraron clientes.</div>
                        ) : (
                            filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    type="button"
                                    className={styles.clientPickRow}
                                    onClick={() => handleSelectClient(client)} >
                                    <span className={styles.avatar}>
                                        {client.nombre.charAt(0).toUpperCase()}
                                    </span>
                                    <span className={styles.clientPickInfo}>
                                        <span className={styles.clientPickName}>{client.nombre}</span>
                                        <span className={styles.clientPickEmail}>{client.email}</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === "list" && (
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollWrapper}>
                        <div className={styles.tableHeader} role="row">
                            <span>Cliente</span>
                            <span>Estado</span>
                            <span>Presupuesto</span>
                            <span>Fecha límite</span>
                            <span>Modificado por</span>
                            <span>Modificado el</span>
                            <span>Creado por</span>
                            <span>Creado el</span>
                        </div>

                        <div key={animKey} className={styles.bidList}>
                            {bids.map((bid, index) => (
                                <div
                                    key={bid.id}
                                    className={`${styles.bidRow} ${styles.animatedRow}`}
                                    role="row"
                                    style={{ "--index": index } as React.CSSProperties} >
                                    <div className={styles.cellCliente}>
                                        <div className={styles.bidIdentity}>
                                            <span className={styles.avatar}>
                                                {bid.cliente.nombre.charAt(0).toUpperCase()}
                                            </span>
                                            <span className={styles.bidClientName}>{bid.cliente.nombre}</span>
                                        </div>
                                    </div>

                                    <div className={styles.cellEstado}>
                                        <span className={`${styles.badge} ${styles[`badge_${bid.estado}`]}`}>
                                            {stateLabels[bid.estado] ?? bid.estado}
                                        </span>
                                    </div>

                                    <div className={styles.cellPresupuesto}>
                                        <span className={styles.priceText}>
                                            {formatPrice(bid.presupuestoMaximo)}
                                        </span>
                                    </div>

                                    <div className={styles.cellFechaLimite}>
                                        <span className={styles.metaText}>
                                            {formatDate(bid.fechaLimite)}
                                        </span>
                                    </div>

                                    <div className={styles.cellModificadoPor}>
                                        <span className={styles.metaText}>
                                            {bid.modificador ? bid.modificador.nombre : "No modificado"}
                                        </span>
                                    </div>

                                    <div className={styles.cellModificadoEl}>
                                        <span className={styles.metaText}>
                                            {bid.updatedAt ? formatDate(bid.updatedAt) : "Sin modificar"}
                                        </span>
                                    </div>

                                    <div className={styles.cellCreadoPor}>
                                        <span className={styles.metaText}>
                                            {bid.creador.nombre}
                                        </span>
                                    </div>

                                    <div className={styles.cellCreadoEl}>
                                        <span className={styles.dateText}>{formatDate(bid.createdAt)}</span>
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