"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import styles from "./bidDetailClient.module.css";
import { FiFileText, FiPlus, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { useToast } from "@/lib/useToast";

type BidDetail = {
    id: string;
    presupuestoMaximo: string;
    fechaLimite: string;
    estado: string;
    documentoPropuestaUrl: string | null;
    createdAt: string;
    updatedAt: string | null;
    cliente: { id: string; nombre: string; email: string };
    creador: { nombre: string };
    modificador: { nombre: string } | null;
    productos: Array<{
        cantidad: number;
        precioAcordado: string;
        producto: { id: string; nombre: string };
    }>;
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

const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(price));
};

export default function BidDetailClient({ bidId }: { bidId: string }) {
    const router = useRouter();
    const { toast, showToast } = useToast();
    const [finalizingBid, setFinalizingBid] = useState(false);
    const [losingBid, setLosingBid] = useState(false);
    const [invoicingBid, setInvoicingBid] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [sendingBid, setSendingBid] = useState(false);

    const { data: bid, isLoading, error } = useSWR<BidDetail>(
        `/api/licitaciones/${bidId}`,
        fetcher
    );

    const totalProducts = bid?.productos.reduce(
        (sum, item) => sum + item.cantidad * Number(item.precioAcordado),
        0
    ) ?? 0;

    const handleFinalizeBid = async () => {
        setFinalizingBid(true);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/finalizar`, {
                method: "POST",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Error al finalizar la licitación");
            }

            await mutate(`/api/licitaciones/${bidId}`);
            showToast("Licitación finalizada exitosamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al finalizar la licitación";
            showToast(message, "error");
        } finally {
            setFinalizingBid(false);
        }
    };

    const handleLoseBid = async () => {
        setLosingBid(true);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/perder`, {
                method: "POST",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Error al marcar la licitación como perdida");
            }

            await mutate(`/api/licitaciones/${bidId}`);
            showToast("Licitación marcada como perdida", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al marcar la licitación como perdida";
            showToast(message, "error");
        } finally {
            setLosingBid(false);
        }
    };

    const handleInvoiceBid = async () => {
        setInvoicingBid(true);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/facturar`, {
                method: "POST",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Error al facturar la licitación");
            }

            await mutate(`/api/licitaciones/${bidId}`);
            showToast("Licitación facturada exitosamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al facturar la licitación";
            showToast(message, "error");
        } finally {
            setInvoicingBid(false);
        }
    };

    const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingDoc(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/licitaciones/${bidId}/documento`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Error al subir el documento");
            }

            await mutate(`/api/licitaciones/${bidId}`);
            showToast("Documento subido correctamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al subir el documento";
            showToast(message, "error");
        } finally {
            setUploadingDoc(false);
            e.target.value = "";
        }
    };

    const handleSendBid = async () => {
        setSendingBid(true);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/enviar`, {
                method: "POST",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Error al enviar la licitación");
            }

            await mutate(`/api/licitaciones/${bidId}`);
            showToast("Licitación enviada exitosamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al enviar la licitación";
            showToast(message, "error");
        } finally {
            setSendingBid(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.loadingText}>Cargando licitacion...</p>
            </div>
        );
    }

    if (error || !bid) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.errorText}>No se pudo cargar la licitacion.</p>
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
                    <button className={styles.button} onClick={() => router.push("/licitaciones")}>
                        <FiArrowLeft size={16} /> Volver
                    </button>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.statusWrapper}>
                        <span className={styles.statusLabel}>Estado:</span>
                        <span className={`${styles.badge} ${styles[`badge_${bid.estado}`]}`}>
                            {stateLabels[bid.estado] ?? bid.estado}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.titleCard}>Detalles de la licitación</div>

            {bid.estado === "borrador" && (
                <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                    <div className={styles.sectionHeaderRow}>
                        <span className={styles.sectionTitle}>Documento de propuesta</span>
                    </div>

                    {bid.documentoPropuestaUrl ? (
                        <a
                            href={bid.documentoPropuestaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.docLink}
                        >
                            <FiFileText size={16} />
                            Ver documento subido
                        </a>
                    ) : (
                        <p className={styles.emptyText}>Aún no se ha subido ningún documento.</p>
                    )}

                    <label className={styles.addButton} style={{ cursor: uploadingDoc ? "not-allowed" : "pointer" }}>
                        <FiPlus size={14} />
                        {uploadingDoc ? "Subiendo..." : bid.documentoPropuestaUrl ? "Reemplazar documento" : "Subir documento"}
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleUploadDocument}
                            disabled={uploadingDoc}
                            style={{ display: "none" }}
                        />
                    </label>

                    <button
                        className={styles.addButton}
                        onClick={handleSendBid}
                        disabled={sendingBid || !bid.documentoPropuestaUrl}
                        title={!bid.documentoPropuestaUrl ? "Debes subir un documento primero" : undefined}
                    >
                        <FiArrowRight size={14} />
                        {sendingBid ? "Enviando..." : "Enviar licitación"}
                    </button>
                </div>
            )}

            {bid.estado === "activa" && (
                <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                    <div className={styles.sectionHeaderRow}>
                        <span className={styles.sectionTitle}>Resolver licitación</span>
                    </div>

                    <div className={styles.actionsRow}>
                        <button
                            className={styles.addButton}
                            onClick={handleFinalizeBid}
                            disabled={finalizingBid || losingBid}
                        >
                            {finalizingBid ? "Finalizando..." : "Marcar como finalizada"}
                        </button>

                        <button
                            className={styles.dangerButton}
                            onClick={handleLoseBid}
                            disabled={finalizingBid || losingBid}
                        >
                            {losingBid ? "Marcando..." : "Marcar como perdida"}
                        </button>
                    </div>
                </div>
            )}

            {bid.estado === "finalizada" && (
                <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                    <div className={styles.sectionHeaderRow}>
                        <span className={styles.sectionTitle}>Facturación</span>
                    </div>

                    <button
                        className={styles.addButton}
                        onClick={handleInvoiceBid}
                        disabled={invoicingBid}
                    >
                        {invoicingBid ? "Facturando..." : "Facturar (pasar a por cobrar)"}
                    </button>
                </div>
            )}

            <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                <div className={styles.clientCard}>
                    <span className={styles.clientAvatar}>
                        {bid.cliente.nombre.charAt(0).toUpperCase()}
                    </span>
                    <div className={styles.clientInfo}>
                        <span className={styles.clientName}>{bid.cliente.nombre}</span>
                        <span className={styles.clientEmail}>{bid.cliente.email}</span>
                    </div>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Presupuesto maximo</span>
                        <span className={styles.infoValue}>{formatPrice(bid.presupuestoMaximo)}</span>
                    </div>

                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Fecha limite</span>
                        <span className={styles.infoValue}>{formatDate(bid.fechaLimite)}</span>
                    </div>

                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Modificado por</span>
                        <span className={styles.infoValue}>
                            {bid.modificador ? bid.modificador.nombre : "No modificado"}
                        </span>
                    </div>

                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Modificado el</span>
                        <span className={styles.infoValue}>
                            {bid.updatedAt ? formatDate(bid.updatedAt) : "Sin modificar"}
                        </span>
                    </div>

                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Creado por</span>
                        <span className={styles.infoValue}>{bid.creador.nombre}</span>
                    </div>

                    <div className={styles.infoCard}>
                        <span className={styles.infoLabel}>Creado el</span>
                        <span className={styles.infoValue}>{formatDate(bid.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                <div className={styles.sectionHeaderRow}>
                    <button className={styles.button} onClick={() => router.push(`/licitaciones/${bidId}/productos`)}>
                        Ver productos
                        <FiArrowRight size={14} />
                    </button>
                </div>

                {bid.productos.length > 0 && (
                    <div className={styles.summaryGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabel}>Total de productos</span>
                            <span className={styles.infoValue}>{bid.productos.length}</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabel}>Monto total</span>
                            <span className={styles.infoValue}>{formatPrice(String(totalProducts))}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className={`${styles.sectionCard} ${styles.sectionCardInfo}`}>
                <div className={styles.sectionHeaderRow}>
                    <button className={styles.button} onClick={() => router.push(`/licitaciones/${bidId}/transiciones`)}>
                        Ver transiciones
                        <FiArrowRight size={14} />
                    </button>
                </div>

                {bid.historial.length > 0 && (
                    <div className={styles.historyPreview}>
                        <span className={styles.infoLabel}>Última transición</span>
                        <span className={styles.historyStates}>
                            {bid.historial[0].estadoAnterior ? stateLabels[bid.historial[0].estadoAnterior] : "—"}
                            {" → "}
                            {stateLabels[bid.historial[0].estadoNuevo]}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}