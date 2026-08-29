"use client";

import { useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useToast } from "@/lib/useToast";
import styles from "./productsClient.module.css";

type Product = {
    id: string;
    nombre: string;
    precioBase: string;
    createdAt: string;
    updatedAt: string | null;
    creador: { nombre: string };
    modificador: { nombre: string } | null;
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
});

const mutationFetcher = async (url: string, { arg }: { arg: { name: string; basePrice: string } }) => {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al crear el producto");
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
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
        currencyDisplay: "code",
    }).format(Number(price));
};

export default function ProductsClient() {
    const [isCreating, setIsCreating] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const isMounted = useIsMounted();
    const { toast, showToast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        basePrice: "",
    });

    const { data: products = [], isValidating, mutate: refreshProducts } = useSWR<Product[]>(
        isMounted ? "/api/productos" : null,
        fetcher
    );

    const { trigger: createProduct, isMutating } = useSWRMutation("/api/productos", mutationFetcher);

    const isLoadingState = isMounted ? isValidating : false;

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
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            showToast(errorMessage, "error");
        }
    };

    return (
        <div className={styles.baseCard}>
            {toast && (
                <div key={toast.id} className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    {toast.message}
                </div>
            )}

            <div className={styles.secondaryCard}>
                <div className={styles.cardHeader}>
                    {isCreating ? (
                        <div className={styles.headerLeft}>
                            <button className={styles.button} onClick={() => setIsCreating(false)}>
                                ← Volver
                            </button>
                            <div className={styles.titleCard}>Nuevo producto</div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.headerLeft}>
                                <div className={styles.titleCard}>Listado de productos</div>
                                <button className={styles.button} onClick={handleRefresh} disabled={isLoadingState}>
                                    {isLoadingState ? "Cargando..." : "Refrescar"}
                                </button>
                            </div>

                            <button className={styles.button} onClick={() => setIsCreating(true)}>
                                + Nuevo producto
                            </button>
                        </>
                    )}
                </div>

                {isCreating ? (
                    <>
                        <div className={styles.formCard}>
                            <form
                                id="product-form"
                                onSubmit={handleSubmitProduct}
                                className={styles.formContainer} >
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nombre del producto</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Licencia de software anual"
                                        className={styles.formInput}
                                        required />
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
                                        required />
                                </div>
                            </form>
                        </div>

                        <div className={styles.formActions}>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.cancelButton}`}
                                onClick={() => setIsCreating(false)}
                                disabled={isMutating} >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="product-form"
                                className={styles.button}
                                disabled={isMutating} >
                                {isMutating ? "Guardando..." : "Guardar producto"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableHeader} role="row">
                            <span>Nombre</span>
                            <span>Precio base</span>
                            <span>Creado por</span>
                            <span>Modificado por</span>
                            <span className={styles.alignRight}>Registrado</span>
                        </div>

                        <div key={animKey} className={styles.productList}>
                            {products.map((product, index) => (
                                <div
                                    key={product.id}
                                    className={`${styles.productRow} ${styles.animatedRow}`}
                                    role="row"
                                    style={{ "--index": index } as React.CSSProperties} >
                                    <div className={styles.productIdentity}>
                                        <span className={styles.avatar}>
                                            {product.nombre.charAt(0).toUpperCase()}
                                        </span>
                                        <span className={styles.productName}>{product.nombre}</span>
                                    </div>

                                    <span className={styles.priceText}>{formatPrice(product.precioBase)}</span>

                                    <span className={styles.metaText}>{product.creador.nombre}</span>

                                    <span className={styles.metaText}>
                                        {product.modificador ? product.modificador.nombre : "No modificado"}
                                    </span>

                                    <div className={styles.alignRight}>
                                        <span className={styles.dateText}>{formatDate(product.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}