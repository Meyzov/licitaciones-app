"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import styles from "./bidHistoryClient.module.css";
import { FiArrowLeft } from "react-icons/fi";

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

const stateLabels: Record<string, string> = {
    borrador: "Borrador",
    activa: "Activa",
    finalizada: "Finalizada",
    por_cobrar: "Por cobrar",
    cobrada: "Cobrada",
    perdida: "Perdida",
};

const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    });

const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function BidHistoryClient({ bidId }: { bidId: string }) {
    const router = useRouter();

    const { data: bid, isLoading, error } = useSWR<BidDetail>(
        `/api/licitaciones/${bidId}`,
        fetcher
    );

    if (isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.loadingText}>Cargando historial...</p>
            </div>
        );
    }

    if (error || !bid) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.errorText}>No se pudo cargar el historial.</p>
                <button className={styles.button} onClick={() => router.push("/licitaciones")}>
                    <FiArrowLeft size={16} /> Volver al listado
                </button>
            </div>
        );
    }

    return (
        <div className={styles.secondaryCard}>
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.button} onClick={() => router.push(`/licitaciones/${bidId}`)}>
                        <FiArrowLeft size={16} /> Volver al detalle
                    </button>
                </div>
            </div>

            <div className={styles.titleCard}>Historial de transiciones</div>

            <div className={`${styles.sectionCard} ${styles.sectionCardGrow}`}>
                {bid.historial.length === 0 ? (
                    <p className={styles.emptyText}>Sin transiciones registradas.</p>
                ) : (
                    <div className={styles.historyList}>
                        {bid.historial.map((entry) => (
                            <div key={entry.id} className={styles.historyItem}>
                                <span className={styles.historyStates}>
                                    {entry.estadoAnterior ? stateLabels[entry.estadoAnterior] : "—"}
                                    {" → "}
                                    {stateLabels[entry.estadoNuevo]}
                                </span>
                                <span className={styles.historyMeta}>
                                    {entry.usuario.nombre} · {formatDate(entry.fechaHora)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}