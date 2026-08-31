"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import styles from "./bidHistoryClient.module.css";
import { FiArrowLeft } from "react-icons/fi";

// --- Types ---
type BidDetail = {
    id: string;
    historial: Array<{
        id: string;
        estadoAnterior: string | null;
        estadoNuevo: string;
        fechaHora: string;
        usuario: { nombre: string };
    }>;
};

// --- Labels ---
const stateLabels: Record<string, string> = {
    borrador: "Borrador",
    activa: "Activa",
    finalizada: "Finalizada",
    por_cobrar: "Por cobrar",
    cobrada: "Cobrada",
    perdida: "Perdida",
};

// --- Fetcher ---
const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    });

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

// --- Main component ---
export default function BidHistoryClient({ bidId }: { bidId: string }) {
    const router = useRouter();

    // data
    const { data: bid, isLoading, error } = useSWR<BidDetail>(
        `/api/licitaciones/${bidId}`,
        fetcher
    );

    // --- Render: loading ---
    if (isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.loadingText}>Cargando historial...</p>
            </div>
        );
    }

    // --- Render: error ---
    if (error || !bid) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.errorText}>No se pudo cargar el historial.</p>
                <button
                    className={styles.button}
                    onClick={() => router.push("/licitaciones")}
                >
                    <FiArrowLeft size={16} /> Volver al listado
                </button>
            </div>
        );
    }

    // --- Render: main ---
    return (
        <div className={styles.secondaryCard}>
            {/* Header */}
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.button}
                        onClick={() => router.push(`/licitaciones/${bidId}`)}
                    >
                        <FiArrowLeft size={16} /> Volver al detalle
                    </button>
                </div>
            </div>

            {/* Title */}
            <div className={styles.titleCard}>Historial de transiciones</div>

            {/* History list */}
            <div className={`${styles.sectionCard} ${styles.sectionCardGrow}`}>
                {bid.historial.length === 0 ? (
                    <p className={styles.emptyText}>Sin transiciones registradas.</p>
                ) : (
                    <div className={styles.historyList}>
                        {bid.historial.map((entry) => (
                            <div key={entry.id} className={styles.historyItem}>
                                <span className={styles.historyStates}>
                                    {entry.estadoAnterior
                                        ? stateLabels[entry.estadoAnterior]
                                        : "—"}
                                    {" → "}
                                    {stateLabels[entry.estadoNuevo]}
                                </span>
                                <span className={styles.historyMeta}>
                                    {entry.usuario.nombre} ·{" "}
                                    {formatDate(entry.fechaHora)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}