"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import {
    FiArrowLeft,
    FiBox,
    FiUserPlus,
    FiCalendar,
    FiEdit3,
    FiClock,
} from "react-icons/fi";
import { useToast } from "@/lib/useToast";
import styles from "./productDetailClient.module.css";

// --- Types ---
type Product = {
    id: string;
    nombre: string;
    precioBase: number;
    createdAt: string;
    updatedAt: string | null;
    creador: {
        nombre: string;
    };
    modificador: {
        nombre: string;
    } | null;
};

type ProductDetailClientProps = {
    productId: string;
};

type UpdateProductData = {
    name: string;
    basePrice: number;
};

// --- Fetchers ---
const fetcher = async (url: string): Promise<Product> => {
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Error al obtener el producto.",
        );
    }

    return data;
};

const updateProductFetcher = async (
    url: string,
    { arg }: { arg: UpdateProductData },
) => {
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || "Error al actualizar el producto.",
        );
    }

    return data;
};

// --- Hooks ---
const useIsMounted = () => {
    return useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );
};

// --- Formatters ---
const formatDate = (isoDate: string | null) => {
    if (!isoDate) {
        return "Sin modificar";
    }

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

// --- Edit Form ---
function ProductEditForm({ product, onCancel, onSuccess }: {
    product: Product;
    onCancel: () => void;
    onSuccess: () => void;
}) {
    const { toast, showToast } = useToast();

    const [formData, setFormData] = useState({
        name: product.nombre,
        basePrice: String(product.precioBase),
    });

    const {
        trigger: updateProduct,
        isMutating,
    } = useSWRMutation(
        `/api/productos/${product.id}`,
        updateProductFetcher,
    );

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (
        e: React.SyntheticEvent<HTMLFormElement>,
    ) => {
        e.preventDefault();

        const parsedPrice = Number(formData.basePrice);

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            showToast(
                "El precio base debe ser un número mayor a 0.",
                "error",
            );

            return;
        }

        try {
            await updateProduct({
                name: formData.name,
                basePrice: parsedPrice,
            });

            showToast(
                "Producto actualizado exitosamente",
                "success",
            );

            setTimeout(() => {
                onSuccess();
            }, 800);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Error desconocido";

            showToast(errorMessage, "error");
        }
    };

    const auditItems = [
        {
            icon: <FiUserPlus />,
            label: "Creado por",
            value: product.creador.nombre,
        },
        {
            icon: <FiCalendar />,
            label: "Creado el",
            value: formatDate(product.createdAt),
        },
        {
            icon: <FiEdit3 />,
            label: "Modificado por",
            value: product.modificador
                ? product.modificador.nombre
                : "No modificado",
        },
        {
            icon: <FiClock />,
            label: "Modificado el",
            value: formatDate(product.updatedAt),
        },
    ];

    return (
        <>
            {toast && (
                <div
                    key={toast.id}
                    className={`${styles.toast} ${styles[`toast_${toast.type}`]
                        }`}
                >
                    {toast.message}
                </div>
            )}

            <div className={styles.content}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <div className={styles.formHeaderIcon}>
                            <FiBox />
                        </div>

                        <div>
                            <div className={styles.formTitle}>
                                Información del producto
                            </div>

                            <div className={styles.formDescription}>
                                Modifica los datos principales del producto.
                            </div>
                        </div>
                    </div>

                    <form
                        id="product-edit-form"
                        onSubmit={handleSubmit}
                        className={styles.formContainer}
                    >
                        <div className={styles.formGroup}>
                            <label
                                htmlFor="name"
                                className={styles.formLabel}
                            >
                                Nombre del producto
                            </label>

                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Ej. Cemento Portland"
                                className={styles.formInput}
                                required
                                disabled={isMutating}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label
                                htmlFor="basePrice"
                                className={styles.formLabel}
                            >
                                Precio base
                            </label>

                            <input
                                id="basePrice"
                                type="number"
                                name="basePrice"
                                value={formData.basePrice}
                                onChange={handleInputChange}
                                placeholder="Ej. 25.50"
                                className={styles.formInput}
                                min="0.01"
                                step="0.01"
                                required
                                disabled={isMutating}
                            />
                        </div>
                    </form>
                </div>

                <div className={styles.auditSection}>
                    <div className={styles.auditGrid}>
                        {auditItems.map((item, index) => (
                            <div
                                key={index}
                                className={styles.auditItemCard}
                            >
                                <div className={styles.auditItemIcon}>
                                    {item.icon}
                                </div>

                                <div className={styles.auditItemBody}>
                                    <span
                                        className={
                                            styles.auditItemLabel
                                        }
                                    >
                                        {item.label}
                                    </span>

                                    <span
                                        className={
                                            styles.auditItemValue
                                        }
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.formActions}>
                <button
                    type="button"
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={onCancel}
                    disabled={isMutating}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="product-edit-form"
                    className={`${styles.button} ${styles.buttonSuccess}`}
                    disabled={isMutating}
                >
                    {isMutating
                        ? "Guardando..."
                        : "Guardar cambios"}
                </button>
            </div>
        </>
    );
}

// --- Main Component ---
export default function ProductDetailClient({ productId }: ProductDetailClientProps) {
    const router = useRouter();
    const isMounted = useIsMounted();

    const {
        data: product,
        error,
        isLoading,
    } = useSWR<Product>(
        isMounted ? `/api/productos/${productId}` : null,
        fetcher,
    );

    const handleGoBack = () => {
        router.push("/productos");
    };

    if (!isMounted || isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner} />

                    <span>Cargando producto...</span>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={styles.secondaryCard}>
                <div className={styles.errorState}>
                    <div className={styles.errorTitle}>
                        No se pudo cargar el producto
                    </div>

                    <div className={styles.errorMessage}>
                        {error instanceof Error
                            ? error.message
                            : "Producto no encontrado."}
                    </div>

                    <button
                        type="button"
                        className={styles.button}
                        onClick={handleGoBack}
                    >
                        <FiArrowLeft />
                        Volver a productos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.secondaryCard}>
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <button
                        type="button"
                        className={styles.button}
                        onClick={handleGoBack}
                    >
                        <FiArrowLeft />
                        Volver
                    </button>

                    <div className={styles.titleCard}>
                        Editar producto
                    </div>
                </div>
            </div>

            <ProductEditForm
                product={product}
                onCancel={handleGoBack}
                onSuccess={handleGoBack}
            />
        </div>
    );
}