"use client";

import { useState, useSyncExternalStore, useMemo } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/useToast";
import { FiRefreshCw, FiArrowLeft, FiPlus } from "react-icons/fi";
import styles from "./productsClient.module.css";

// --- Types ---
type Product = {
    id: string;
    nombre: string;
    precioBase: string;
    createdAt: string;
    updatedAt: string | null;
    creador: { nombre: string };
    modificador: { nombre: string } | null;
};

// --- Fetchers ---
const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
    });

const mutationFetcher = async (
    url: string,
    { arg }: { arg: { name: string; basePrice: string } }
) => {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al crear el producto");
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
export default function ProductsClient() {
    // state
    const router = useRouter();

    const [isCreating, setIsCreating] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const isMounted = useIsMounted();
    const { toast, showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        basePrice: "",
    });

    // data
    const {
        data: products = [],
        isValidating,
        mutate: refreshProducts,
    } = useSWR<Product[]>(isMounted ? "/api/productos" : null, fetcher);

    const { trigger: createProduct, isMutating } = useSWRMutation(
        "/api/productos",
        mutationFetcher
    );

    const isLoadingState = isMounted ? isValidating : false;

    // filters
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const query = searchQuery.trim().toLowerCase();
        return products.filter((product) =>
            product.nombre.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    // handlers
    const handleRefresh = async () => {
        await refreshProducts();
        setAnimKey((prev) => prev + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitProduct = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await createProduct(formData);

            setFormData({ name: "", basePrice: "" });
            setIsCreating(false);
            await refreshProducts();
            setAnimKey((prev) => prev + 1);
            showToast("Producto creado exitosamente", "success");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Error desconocido";
            showToast(errorMessage, "error");
        }
    };

    // render
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
                {isCreating ? (
                    <div className={styles.headerLeft}>
                        <button className={styles.button} onClick={() => setIsCreating(false)}>
                            <FiArrowLeft className={styles.refreshIcon} /> Volver
                        </button>
                        <div className={styles.titleCard}>Nuevo producto</div>
                    </div>
                ) : (
                    <>
                        <div className={styles.headerLeft}>
                            <div className={styles.titleCard}>Listado de productos</div>
                            <button
                                className={styles.button}
                                onClick={handleRefresh}
                                disabled={isLoadingState}
                                title={isLoadingState ? "Cargando..." : "Refrescar"}
                            >
                                <FiRefreshCw
                                    className={`${styles.refreshIcon} ${isLoadingState ? styles.refreshIconSpinning : ""
                                        }`}
                                />
                                <span className={styles.refreshButtonText}>
                                    {isLoadingState ? "Cargando..." : "Refrescar"}
                                </span>
                            </button>
                        </div>

                        <button
                            className={`${styles.button} ${styles.buttonGreen}`}
                            onClick={() => setIsCreating(true)}
                        >
                            <FiPlus className={styles.refreshIcon} /> Nuevo producto
                        </button>
                    </>
                )}
            </div>

            {/* Search bar (list view only) */}
            {!isCreating && (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.formInput}
                    />
                </div>
            )}

            {/* Create form */}
            {isCreating ? (
                <>
                    <div className={styles.formCard}>
                        <form
                            id="product-form"
                            onSubmit={handleSubmitProduct}
                            className={styles.formContainer}
                        >
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nombre del producto</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ej. Licencia de software anual"
                                    className={styles.formInput}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Precio base</label>
                                <input
                                    type="number"
                                    name="basePrice"
                                    value={formData.basePrice}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0.01"
                                    className={styles.formInput}
                                    required
                                />
                            </div>
                        </form>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={`${styles.button} ${styles.buttonRed}`}
                            onClick={() => setIsCreating(false)}
                            disabled={isMutating}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="product-form"
                            className={`${styles.button} ${styles.buttonGreen}`}
                            disabled={isMutating}
                        >
                            {isMutating ? "Guardando..." : "Guardar producto"}
                        </button>
                    </div>
                </>
            ) : (
                /* Products table */
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollWrapper}>
                        <div className={styles.tableHeader} role="row">
                            <span>Nombre</span>
                            <span>Precio base</span>
                            <span>Modificado por</span>
                            <span>Modificado el</span>
                            <span>Creado por</span>
                            <span>Creado el</span>
                        </div>

                        <div key={animKey} className={styles.productList}>
                            {filteredProducts.length === 0 ? (
                                <div className={styles.emptyState}>
                                    No se encontraron productos.
                                </div>
                            ) : (
                                filteredProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className={`${styles.productRow} ${styles.animatedRow}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => router.push(`/productos/${product.id}`)}
                                        style={{ "--index": index } as React.CSSProperties}
                                    >
                                        <div className={styles.cellNombre}>
                                            <div className={styles.productIdentity}>
                                                <span className={styles.avatar}>
                                                    {product.nombre.charAt(0).toUpperCase()}
                                                </span>
                                                <span className={styles.productName}>
                                                    {product.nombre}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.cellPrecioBase}>
                                            <span className={styles.priceText}>
                                                {formatPrice(product.precioBase)}
                                            </span>
                                        </div>

                                        <div className={styles.cellModificadoPor}>
                                            <span className={styles.metaText}>
                                                {product.modificador
                                                    ? product.modificador.nombre
                                                    : "No modificado"}
                                            </span>
                                        </div>

                                        <div className={styles.cellModificadoEl}>
                                            <span className={styles.metaText}>
                                                {product.updatedAt
                                                    ? formatDate(product.updatedAt)
                                                    : "Sin modificar"}
                                            </span>
                                        </div>

                                        <div className={styles.cellCreadoPor}>
                                            <span className={styles.metaText}>
                                                {product.creador.nombre}
                                            </span>
                                        </div>

                                        <div className={styles.cellCreadoEl}>
                                            <span className={styles.dateText}>
                                                {formatDate(product.createdAt)}
                                            </span>
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