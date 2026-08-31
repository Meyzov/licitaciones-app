"use client";

import { useState, useSyncExternalStore, useMemo } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useToast } from "@/lib/useToast";
import { useRouter } from "next/navigation";
import { FiPlus, FiArrowLeft, FiRefreshCw, FiCalendar, FiChevronRight, FiTrash2 } from "react-icons/fi";
import styles from "./bidsClient.module.css";

// --- Types ---
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

// --- Labels ---
const stateLabels: Record<string, string> = {
    borrador: "Borrador",
    activa: "Activa",
    finalizada: "Finalizada",
    por_cobrar: "Por cobrar",
    cobrada: "Cobrada",
    perdida: "Perdida",
};

// --- Fetchers ---
const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    });

const mutationFetcher = async (
    url: string,
    { arg }: { arg: { clientId: string; maxBudget: string; deadline: string } }
) => {
    // send to server as UTC ISO string
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...arg,
            deadline: new Date(arg.deadline).toISOString(),
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al crear la licitación");
    }
    return data;
};

const deleteFetcher = async (
    url: string,
    { arg }: { arg: string }
) => {
    const response = await fetch(`${url}/${arg}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al eliminar la licitación");
    }
    return data;
};

// --- Hooks ---
const useIsMounted = () => {
    return useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );
};

// --- Formatters ---
const formatDate = (isoDate: string) => {
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

const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(price));
};

// --- Main component ---
export default function BidsClient() {
    const [view, setView] = useState<View>("list");
    const [animKey, setAnimKey] = useState(0);
    const isMounted = useIsMounted();
    const { toast, showToast } = useToast();
    const router = useRouter();

    const [clientSearch, setClientSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const [formData, setFormData] = useState({
        maxBudget: "",
        deadline: "",
    });

    // --- Data ---
    const {
        data: bids = [],
        isValidating,
        mutate: refreshBids,
    } = useSWR<Bid[]>(isMounted ? "/api/licitaciones" : null, fetcher);

    const { data: clients = [] } = useSWR<Client[]>(
        isMounted && view === "selectClient" ? "/api/clientes" : null,
        fetcher
    );

    const { trigger: createBid, isMutating } = useSWRMutation(
        "/api/licitaciones",
        mutationFetcher
    );

    const { trigger: deleteBid, isMutating: isDeleting } = useSWRMutation(
        "/api/licitaciones",
        deleteFetcher
    );

    const isLoadingState = isMounted ? isValidating : false;

    // --- Filters ---
    const filteredClients = useMemo(() => {
        if (!clientSearch.trim()) return clients;
        const query = clientSearch.trim().toLowerCase();
        return clients.filter((client) => client.nombre.toLowerCase().startsWith(query));
    }, [clients, clientSearch]);

    const filteredBids = useMemo(() => {
        if (!searchQuery.trim()) return bids;
        const query = searchQuery.trim().toLowerCase();
        return bids.filter((bid) => bid.cliente.nombre.toLowerCase().includes(query));
    }, [bids, searchQuery]);

    // --- Handlers ---
    const handleDeleteBid = async (e: React.MouseEvent, bidId: string) => {
        e.stopPropagation();
        try {
            await deleteBid(bidId);
            await refreshBids();
            setAnimKey((prev) => prev + 1);
            showToast("Licitación eliminada exitosamente", "success");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            showToast(errorMessage, "error");
        }
    };

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

    // --- Render ---
    return (
        <div className={styles.secondaryCard}>
            {/* Toast */}
            {toast && (
                <div
                    key={toast.id}
                    className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}
                >
                    {toast.message}
                </div>
            )}

            {/* Header */}
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
                                <FiRefreshCw
                                    className={`${styles.refreshIcon} ${isLoadingState ? styles.refreshIconSpinning : ""
                                        }`}
                                    size={16}
                                />
                                <span className={styles.refreshButtonText}>
                                    {isLoadingState ? "Cargando..." : "Refrescar"}
                                </span>
                            </button>
                        </div>

                        <button
                            className={`${styles.button} ${styles.buttonGreen}`}
                            onClick={handleStartCreating}
                        >
                            <span className={styles.inlineFlexBox}>
                                <FiPlus size={16} /> Nueva licitación
                            </span>
                        </button>
                    </>
                )}

                {view === "create" && (
                    <div className={styles.headerLeft}>
                        <button className={styles.button} onClick={() => setView("list")}>
                            <span className={styles.inlineFlexBox}>
                                <FiArrowLeft size={16} /> Volver
                            </span>
                        </button>
                        <div className={styles.titleCard}>Nueva licitación</div>
                    </div>
                )}

                {view === "selectClient" && (
                    <div className={styles.headerLeft}>
                        <button className={styles.button} onClick={() => setView("create")}>
                            <span className={styles.inlineFlexBox}>
                                <FiArrowLeft size={16} /> Volver
                            </span>
                        </button>
                        <div className={styles.titleCard}>Seleccionar cliente</div>
                    </div>
                )}
            </div>

            {/* List search */}
            {view === "list" && (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar licitación por nombre de cliente..."
                        className={styles.formInput}
                    />
                </div>
            )}

            {/* Create form */}
            {view === "create" && (
                <>
                    <div className={styles.formCard}>
                        <form
                            id="bid-form"
                            onSubmit={handleSubmitBid}
                            className={styles.formContainer}
                        >
                            {/* Client picker */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Cliente</label>
                                <button
                                    type="button"
                                    className={styles.clientPickerButton}
                                    onClick={() => setView("selectClient")}
                                >
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
                                    <span className={styles.clientPickerIcon}>
                                        <FiChevronRight size={16} />
                                    </span>
                                </button>
                            </div>

                            {/* Budget */}
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
                                    required
                                />
                            </div>

                            {/* Deadline */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Fecha límite</label>
                                <div className={styles.datePickerWrapper}>
                                    <FiCalendar
                                        className={styles.datePickerIcon}
                                        size={18}
                                    />
                                    <input
                                        type="datetime-local"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleInputChange}
                                        className={`${styles.formInput} ${styles.dateInput}`}
                                        required
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Form actions */}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={`${styles.button} ${styles.buttonRed}`}
                            onClick={() => setView("list")}
                            disabled={isMutating}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="bid-form"
                            className={`${styles.button} ${styles.buttonGreen}`}
                            disabled={isMutating}
                        >
                            {isMutating ? "Guardando..." : "Guardar licitación"}
                        </button>
                    </div>
                </>
            )}

            {/* Select client view */}
            {view === "selectClient" && (
                <div className={styles.tableCard}>
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            placeholder="Buscar cliente por nombre..."
                            className={styles.searchInput}
                            autoFocus
                        />
                    </div>

                    <div className={styles.clientPickList}>
                        {filteredClients.length === 0 ? (
                            <div className={styles.emptyState}>
                                No se encontraron clientes.
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    type="button"
                                    className={styles.clientPickRow}
                                    onClick={() => handleSelectClient(client)}
                                >
                                    <span className={styles.avatar}>
                                        {client.nombre.charAt(0).toUpperCase()}
                                    </span>
                                    <span className={styles.clientPickInfo}>
                                        <span className={styles.clientPickName}>
                                            {client.nombre}
                                        </span>
                                        <span className={styles.clientPickEmail}>
                                            {client.email}
                                        </span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
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
                            <span></span>
                        </div>

                        <div key={animKey} className={styles.bidList}>
                            {filteredBids.length === 0 ? (
                                <div className={styles.emptyState}>
                                    No se encontraron licitaciones.
                                </div>
                            ) : (
                                filteredBids.map((bid, index) => (
                                    <div
                                        key={bid.id}
                                        className={`${styles.bidRow} ${styles.animatedRow} ${styles.bidRowClickable}`}
                                        role="row"
                                        onClick={() => router.push(`/licitaciones/${bid.id}`)}
                                        style={
                                            { "--index": index } as React.CSSProperties
                                        }
                                    >
                                        <div className={styles.cellCliente}>
                                            <div className={styles.bidIdentity}>
                                                <span className={styles.avatar}>
                                                    {bid.cliente.nombre
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                                <span className={styles.bidClientName}>
                                                    {bid.cliente.nombre}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.cellEstado}>
                                            <span
                                                className={`${styles.badge} ${styles[`badge_${bid.estado}`]
                                                    }`}
                                            >
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
                                                {bid.modificador
                                                    ? bid.modificador.nombre
                                                    : "No modificado"}
                                            </span>
                                        </div>

                                        <div className={styles.cellModificadoEl}>
                                            <span className={styles.metaText}>
                                                {bid.updatedAt
                                                    ? formatDate(bid.updatedAt)
                                                    : "Sin modificar"}
                                            </span>
                                        </div>

                                        <div className={styles.cellCreadoPor}>
                                            <span className={styles.metaText}>
                                                {bid.creador.nombre}
                                            </span>
                                        </div>

                                        <div className={styles.cellCreadoEl}>
                                            <span className={styles.dateText}>
                                                {formatDate(bid.createdAt)}
                                            </span>
                                        </div>

                                        <div className={styles.cellAcciones}>
                                            {bid.estado === "borrador" && (
                                                <button
                                                    type="button"
                                                    className={styles.deleteRowButton}
                                                    onClick={(e) => handleDeleteBid(e, bid.id)}
                                                    disabled={isDeleting}
                                                    title="Eliminar"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}