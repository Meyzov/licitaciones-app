"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import styles from "./dashboardClient.module.css";
import {
    FiFileText,
    FiUsers,
    FiClock,
    FiDollarSign,
    FiRefreshCw,
    FiArrowRight,
    FiAlertCircle,
} from "react-icons/fi";

type DashboardData = {
    licitacionesActivas: number;
    totalClientes: number;
    proximasAVencer: Array<{
        id: string;
        cliente: string;
        fechaLimite: string;
        horasRestantes: number;
    }>;
    totalPorCobrar: number;
    licitacionesRecientes: Array<{
        id: string;
        estado: string;
        presupuestoMaximo: string;
        fechaLimite: string;
        createdAt: string;
        cliente: { nombre: string };
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
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        return res.json();
    });

const useIsMounted = () => {
    return useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );
};

const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(price));
};

const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function DashboardClient({ userName }: { userName: string }) {
    const router = useRouter();
    const isMounted = useIsMounted();

    const { data, isValidating, mutate: refresh } = useSWR<DashboardData>(
        isMounted ? "/api/dashboard" : null,
        fetcher
    );

    const isLoadingState = isMounted ? isValidating : false;

    if (!data && isMounted) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.loadingText}>Cargando panel...</p>
            </div>
        );
    }

    return (
        <div className={styles.secondaryCard}>
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.titleCard}>Hola, {userName}</div>
                    <button
                        className={styles.button}
                        onClick={() => refresh()}
                        disabled={isLoadingState}
                        title={isLoadingState ? "Cargando..." : "Refrescar"}
                    >
                        <FiRefreshCw className={isLoadingState ? styles.refreshIconSpinning : ""} />
                        <span className={styles.refreshButtonText}>
                            {isLoadingState ? "Cargando..." : "Refrescar"}
                        </span>
                    </button>
                </div>
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrapper}>
                        <FiFileText size={18} />
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiValue}>{data?.licitacionesActivas ?? 0}</span>
                        <span className={styles.kpiLabel}>Licitaciones activas</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrapper}>
                        <FiUsers size={18} />
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiValue}>{data?.totalClientes ?? 0}</span>
                        <span className={styles.kpiLabel}>Total de clientes</span>
                    </div>
                </div>

                <div className={`${styles.kpiCard} ${data && data.proximasAVencer.length > 0 ? styles.kpiCardWarning : ""}`}>
                    <div className={styles.kpiIconWrapper}>
                        <FiClock size={18} />
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiValue}>{data?.proximasAVencer.length ?? 0}</span>
                        <span className={styles.kpiLabel}>Próximas a vencer</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrapper}>
                        <FiDollarSign size={18} />
                    </div>
                    <div className={styles.kpiBody}>
                        <span className={styles.kpiValue}>{formatPrice(data?.totalPorCobrar ?? 0)}</span>
                        <span className={styles.kpiLabel}>Total por cobrar</span>
                    </div>
                </div>
            </div>

            <div className={styles.sectionCard}>
                <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Licitaciones recientes</span>
                    <button className={styles.button} onClick={() => router.push("/licitaciones")}>
                        Ver todas
                        <FiArrowRight size={14} />
                    </button>
                </div>

                {!data || data.licitacionesRecientes.length === 0 ? (
                    <p className={styles.emptyText}>No hay licitaciones registradas todavía.</p>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableScrollWrapper}>
                            <div className={styles.tableHeader} role="row">
                                <span>Cliente</span>
                                <span>Estado</span>
                                <span>Presupuesto</span>
                                <span>Fecha límite</span>
                            </div>

                            <div className={styles.bidList}>
                                {data.licitacionesRecientes.map((bid) => (
                                    <div
                                        key={bid.id}
                                        className={styles.bidRow}
                                        role="row"
                                        onClick={() => router.push(`/licitaciones/${bid.id}`)}
                                    >
                                        <div className={styles.cellCliente}>
                                            <span className={styles.bidClientName}>{bid.cliente.nombre}</span>
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.sectionCard}>
                <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>Próximas a vencer (48 horas)</span>
                </div>

                {!data || data.proximasAVencer.length === 0 ? (
                    <p className={styles.emptyText}>No hay licitaciones próximas a vencer.</p>
                ) : (
                    <div className={styles.warningList}>
                        {data.proximasAVencer.map((bid) => (
                            <div
                                key={bid.id}
                                className={styles.warningItem}
                                onClick={() => router.push(`/licitaciones/${bid.id}`)}
                            >
                                <div className={styles.warningMain}>
                                    <span className={styles.warningIcon}>
                                        <FiAlertCircle size={16} />
                                    </span>
                                    <div className={styles.warningInfo}>
                                        <span className={styles.warningClient}>{bid.cliente}</span>
                                        <span className={styles.warningDate}>
                                            Vence: {formatDate(bid.fechaLimite)}
                                        </span>
                                    </div>
                                </div>
                                <span className={styles.warningTag}>
                                    {bid.horasRestantes}h restantes
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}