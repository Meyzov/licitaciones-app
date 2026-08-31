"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import styles from "./bidPaymentsClient.module.css";
import { FiArrowLeft, FiPlus, FiDollarSign } from "react-icons/fi";
import { useToast } from "@/lib/useToast";

// --- Types ---
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

// --- Fetcher ---
const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    });

// --- Formatters ---
const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(price));
};

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
export default function BidPaymentsClient({ bidId }: { bidId: string }) {
    const router = useRouter();
    const { toast, showToast } = useToast();

    // state
    const [amountInput, setAmountInput] = useState("");
    const [registeringPayment, setRegisteringPayment] = useState(false);

    // data
    const { data, isLoading, error } = useSWR<PaymentsData>(
        `/api/licitaciones/${bidId}/pagos`,
        fetcher
    );

    const canRegisterPayment = data?.estado === "por_cobrar";

    // --- Handlers ---
    const handleRegisterPayment = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        const amount = Number(amountInput);

        if (!amount || amount <= 0) {
            showToast("El monto debe ser mayor a 0.", "error");
            return;
        }

        setRegisteringPayment(true);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/pagos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ monto: amount }),
            });

            const responseData = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(responseData.error || "Error al registrar el pago");
            }

            await mutate(`/api/licitaciones/${bidId}/pagos`);
            await mutate(`/api/licitaciones/${bidId}`);

            setAmountInput("");
            showToast(responseData.message || "Pago registrado exitosamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al registrar el pago";
            showToast(message, "error");
        } finally {
            setRegisteringPayment(false);
        }
    };

    // --- Render: loading ---
    if (isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.loadingText}>Cargando pagos...</p>
            </div>
        );
    }

    // --- Render: error ---
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

    // --- Render: main ---
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
            <div className={styles.titleCard}>Pagos de la licitación</div>

            {/* Summary */}
            <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                <div className={styles.summaryGrid}>
                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Total facturado</span>
                        <span className={styles.infoValue}>
                            {formatPrice(data.totalFacturado)}
                        </span>
                    </div>
                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Total pagado</span>
                        <span className={styles.infoValue}>
                            {formatPrice(data.totalPagado)}
                        </span>
                    </div>
                    <div className={`${styles.infoCard} ${styles.infoCardHighlight}`}>
                        <span className={styles.infoLabel}>Saldo pendiente</span>
                        <span className={styles.infoValue}>
                            {formatPrice(data.saldoPendiente)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment form */}
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
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
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

            {/* Payments list */}
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
                                <span className={styles.paymentAmount}>
                                    {formatPrice(pago.monto)}
                                </span>
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