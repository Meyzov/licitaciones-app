"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import styles from "./bidPaymentsClient.module.css";
import { FiArrowLeft, FiPlus, FiDollarSign } from "react-icons/fi";
import { useToast } from "@/lib/useToast";

type PaymentsData = {
    estado: string;
    totalFacturado: number;
    totalPagado: number;
    saldoPendiente: number;
    pagos: Array<{
        id: string;
        monto: string;
        fecha: string;
        creador: { nombre: string };
    }>;
};

const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    });

const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(price));
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

export default function BidPaymentsClient({ bidId }: { bidId: string }) {
    const router = useRouter();
    const { toast, showToast } = useToast();
    const [montoInput, setMontoInput] = useState("");
    const [registeringPayment, setRegisteringPayment] = useState(false);

    const { data, isLoading, error } = useSWR<PaymentsData>(
        `/api/licitaciones/${bidId}/pagos`,
        fetcher
    );

    const canRegisterPayment = data?.estado === "por_cobrar";

    const handleRegisterPayment = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        const monto = Number(montoInput);

        if (!monto || monto <= 0) {
            showToast("El monto debe ser mayor a 0.", "error");
            return;
        }

        setRegisteringPayment(true);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/pagos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ monto }),
            });

            const responseData = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(responseData.error || "Error al registrar el pago");
            }

            await mutate(`/api/licitaciones/${bidId}/pagos`);
            await mutate(`/api/licitaciones/${bidId}`);

            setMontoInput("");
            showToast(responseData.message || "Pago registrado exitosamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al registrar el pago";
            showToast(message, "error");
        } finally {
            setRegisteringPayment(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.loadingText}>Cargando pagos...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.errorText}>No se pudieron cargar los pagos.</p>
                <button className={styles.button} onClick={() => router.push("/licitaciones")}>
                    <FiArrowLeft size={16} /> Volver al listado
                </button>
            </div>
        );
    }

    return (
        <div className={styles.secondaryCard}>
            {toast && (
                <div key={toast.id} className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    {toast.message}
                </div>
            )}

            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.button} onClick={() => router.push(`/licitaciones/${bidId}`)}>
                        <FiArrowLeft size={16} /> Volver al detalle
                    </button>
                </div>
            </div>

            <div className={styles.titleCard}>Pagos de la licitación</div>

            <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                <div className={styles.summaryGrid}>
                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Total facturado</span>
                        <span className={styles.infoValue}>{formatPrice(data.totalFacturado)}</span>
                    </div>
                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Total pagado</span>
                        <span className={styles.infoValue}>{formatPrice(data.totalPagado)}</span>
                    </div>
                    <div className={`${styles.infoCard} ${styles.infoCardHighlight}`}>
                        <span className={styles.infoLabel}>Saldo pendiente</span>
                        <span className={styles.infoValue}>{formatPrice(data.saldoPendiente)}</span>
                    </div>
                </div>
            </div>

            {canRegisterPayment && (
                <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                    <div className={styles.sectionHeaderRow}>
                        <span className={styles.sectionTitle}>Registrar pago</span>
                    </div>

                    <form onSubmit={handleRegisterPayment} className={styles.paymentForm}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Monto (USD)</label>
                            <div className={styles.inputWithIcon}>
                                <FiDollarSign size={16} />
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    max={data.saldoPendiente}
                                    value={montoInput}
                                    onChange={(e) => setMontoInput(e.target.value)}
                                    className={styles.formInput}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={styles.addButton}
                            disabled={registeringPayment}
                        >
                            <FiPlus size={14} />
                            {registeringPayment ? "Registrando..." : "Registrar pago"}
                        </button>
                    </form>
                </div>
            )}

            <div className={`${styles.sectionCard} ${styles.sectionCardGrow}`}>
                <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionTitle}>
                        Historial de pagos {data.pagos.length > 0 && `(${data.pagos.length})`}
                    </span>
                </div>

                {data.pagos.length === 0 ? (
                    <p className={styles.emptyText}>Aún no se han registrado pagos.</p>
                ) : (
                    <div className={styles.paymentsList}>
                        {data.pagos.map((pago) => (
                            <div key={pago.id} className={styles.paymentItem}>
                                <span className={styles.paymentAmount}>{formatPrice(pago.monto)}</span>
                                <span className={styles.paymentMeta}>
                                    {pago.creador.nombre} · {formatDate(pago.fecha)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}