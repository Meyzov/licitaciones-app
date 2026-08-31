"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import styles from "./bidProductsClient.module.css";
import { FiTrash2, FiPlus, FiArrowRight, FiArrowLeft, FiSearch, FiBox } from "react-icons/fi";
import { useToast } from "@/lib/useToast";

// --- Types ---
type BidDetail = {
    id: string;
    estado: string;
    productos: Array<{
        cantidad: number;
        precioAcordado: string;
        producto: { id: string; nombre: string };
    }>;
};

type AvailableProduct = {
    id: string;
    nombre: string;
    descripcion?: string | null;
    precioBase?: string | null;
};

type View = "list" | "add-product";

// --- Fetcher ---
const fetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    });

// --- Formatters ---
const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(price));
};

// --- Main component ---
export default function BidProductsClient({ bidId }: { bidId: string }) {
    const router = useRouter();
    const { toast, showToast } = useToast();

    // state
    const [view, setView] = useState<View>("list");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<{ id: string; nombre: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<AvailableProduct | null>(null);
    const [quantity, setQuantity] = useState<string>("1");
    const [agreedPrice, setAgreedPrice] = useState<string>("");
    const [addingProduct, setAddingProduct] = useState(false);

    // data
    const { data: bid, isLoading, error } = useSWR<BidDetail>(
        `/api/licitaciones/${bidId}`,
        fetcher
    );

    const { data: availableProducts, isLoading: loadingProducts } = useSWR<AvailableProduct[]>(
        view === "add-product" ? `/api/productos` : null,
        fetcher
    );

    const canModifyProducts = bid?.estado === "borrador" || bid?.estado === "activa";

    // --- Filters ---
    const filteredProducts = useMemo(() => {
        if (!availableProducts) return [];
        const q = searchQuery.trim().toLowerCase();
        if (!q) return availableProducts;
        return availableProducts.filter((p) => p.nombre.toLowerCase().includes(q));
    }, [availableProducts, searchQuery]);

    const totalProducts = bid?.productos.reduce(
        (sum, item) => sum + item.cantidad * Number(item.precioAcordado),
        0
    ) ?? 0;

    // --- Handlers ---
    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;

        const productId = productToDelete.id;
        setDeletingId(productId);
        setProductToDelete(null);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/productos/${productId}`, {
                method: "DELETE",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || `Error ${res.status}: No se pudo eliminar el producto`);
            }

            await mutate(`/api/licitaciones/${bidId}`);
            showToast("Producto eliminado correctamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al eliminar el producto";
            showToast(message, "error");
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddProduct = async () => {
        if (!selectedProduct) return;
        const qty = Number(quantity);
        const price = Number(agreedPrice);

        if (!qty || qty <= 0) {
            showToast("La cantidad debe ser mayor a 0.", "error");
            return;
        }
        if (!price || price <= 0) {
            showToast("El precio acordado debe ser mayor a 0.", "error");
            return;
        }

        setAddingProduct(true);

        try {
            const res = await fetch(`/api/licitaciones/${bidId}/productos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productoId: selectedProduct.id,
                    cantidad: qty,
                    precioAcordado: String(price),
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || `Error ${res.status}: No se pudo agregar el producto`);
            }

            await mutate(`/api/licitaciones/${bidId}`);

            setSelectedProduct(null);
            setQuantity("1");
            setAgreedPrice("");
            setSearchQuery("");
            setView("list");
            showToast("Producto agregado correctamente", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error al agregar el producto";
            showToast(message, "error");
        } finally {
            setAddingProduct(false);
        }
    };

    const handleSelectProduct = (product: AvailableProduct) => {
        setSelectedProduct(product);
        setQuantity("1");
        setAgreedPrice(product.precioBase ?? "");
    };

    const handleGoToAddProduct = () => {
        setView("add-product");
        setSearchQuery("");
        setSelectedProduct(null);
        setQuantity("1");
        setAgreedPrice("");
    };

    // --- Render: loading ---
    if (isLoading) {
        return (
            <div className={styles.secondaryCard}>
                <p className={styles.loadingText}>Cargando productos...</p>
            </div>
        );
    }

    // --- Render: error ---
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

            {/* Add product view */}
            {view === "add-product" ? (
                <>
                    {/* Header */}
                    <div className={styles.cardHeader}>
                        <div className={styles.headerLeft}>
                            <button className={styles.button} onClick={() => setView("list")}>
                                <FiArrowLeft size={16} /> Volver a productos
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div className={styles.titleCard}>Agregar producto</div>

                    {/* Product picker */}
                    {!selectedProduct ? (
                        <div className={`${styles.sectionCard} ${styles.sectionCardGrow}`}>
                            <div className={styles.searchBox}>
                                <FiSearch size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.searchInput}
                                    autoFocus
                                />
                            </div>

                            {loadingProducts ? (
                                <p className={styles.loadingText}>Cargando productos...</p>
                            ) : filteredProducts.length === 0 ? (
                                <p className={styles.emptyText}>
                                    {searchQuery.trim()
                                        ? "No se encontraron productos."
                                        : "No hay productos disponibles."}
                                </p>
                            ) : (
                                <div className={styles.pickerList}>
                                    {filteredProducts.map((product) => (
                                        <button
                                            key={product.id}
                                            className={styles.pickerItem}
                                            onClick={() => handleSelectProduct(product)}
                                        >
                                            <div className={styles.pickerItemLeft}>
                                                <span className={styles.pickerIcon}>
                                                    <FiBox size={18} />
                                                </span>
                                                <div className={styles.pickerItemInfo}>
                                                    <span className={styles.pickerItemName}>
                                                        {product.nombre}
                                                    </span>
                                                    {product.descripcion && (
                                                        <span className={styles.pickerItemDesc}>
                                                            {product.descripcion}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {product.precioBase && (
                                                <span className={styles.pickerItemPrice}>
                                                    Precio base: {formatPrice(product.precioBase)}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Selected product form */
                        <div className={`${styles.sectionCard} ${styles.sectionCardGrow}`}>
                            <button
                                className={styles.pickerItem}
                                onClick={() => setSelectedProduct(null)}
                                title="Toca para elegir otro producto"
                            >
                                <div className={styles.pickerItemLeft}>
                                    <span className={styles.pickerIcon}>
                                        <FiBox size={18} />
                                    </span>
                                    <div className={styles.pickerItemInfo}>
                                        <span className={styles.pickerItemName}>
                                            {selectedProduct.nombre}
                                        </span>
                                        {selectedProduct.descripcion && (
                                            <span className={styles.pickerItemDesc}>
                                                {selectedProduct.descripcion}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.pickerItemRight}>
                                    <span className={styles.pickerItemPrice}>
                                        Precio base:{" "}
                                        {selectedProduct.precioBase
                                            ? formatPrice(selectedProduct.precioBase)
                                            : "N/D"}
                                    </span>
                                    <FiArrowRight size={14} />
                                </div>
                            </button>

                            <div className={styles.formGrid}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className={styles.formInput}
                                    />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>
                                        Precio acordado (USD)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={agreedPrice}
                                        onChange={(e) => setAgreedPrice(e.target.value)}
                                        className={styles.formInput}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className={styles.sectionHeaderRow}>
                                <button
                                    className={styles.addButton}
                                    onClick={handleAddProduct}
                                    disabled={addingProduct}
                                >
                                    <FiPlus size={14} />
                                    {addingProduct
                                        ? "Agregando..."
                                        : "Agregar a la licitación"}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* List view */
                <>
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
                    <div className={styles.titleCard}>Productos de la licitación</div>

                    {/* Products table */}
                    <div className={`${styles.sectionCard} ${styles.sectionCardGrow}`}>
                        <div className={styles.sectionHeaderRow}>
                            {canModifyProducts && (
                                <button
                                    className={styles.addButton}
                                    onClick={handleGoToAddProduct}
                                >
                                    <FiPlus size={14} />
                                    Agregar producto
                                </button>
                            )}
                        </div>

                        {bid.productos.length === 0 ? (
                            <p className={styles.emptyText}>
                                No se han agregado productos.
                            </p>
                        ) : (
                            <div className={styles.tableCard}>
                                <div className={styles.tableBody}>
                                    <div className={styles.productTableContainer}>
                                        <div
                                            className={styles.productTableHeader}
                                            role="row"
                                        >
                                            <span>Producto</span>
                                            <span>Cantidad</span>
                                            <span>Precio acordado</span>
                                            <span>Subtotal</span>
                                            {canModifyProducts && <span></span>}
                                        </div>
                                        <div className={styles.productTableList}>
                                            {bid.productos.map((item) => (
                                                <div
                                                    key={item.producto.id}
                                                    className={styles.productTableRow}
                                                    role="row"
                                                >
                                                    <div
                                                        className={styles.cellProducto}
                                                    >
                                                        <span>
                                                            {item.producto.nombre}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={styles.cellCantidad}
                                                    >
                                                        <span>{item.cantidad}</span>
                                                    </div>
                                                    <div
                                                        className={styles.cellPrecio}
                                                    >
                                                        <span>
                                                            {formatPrice(
                                                                item.precioAcordado
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.cellSubtotal
                                                        }
                                                    >
                                                        <span>
                                                            {formatPrice(
                                                                String(
                                                                    item.cantidad *
                                                                    Number(
                                                                        item.precioAcordado
                                                                    )
                                                                )
                                                            )}
                                                        </span>
                                                    </div>
                                                    {canModifyProducts && (
                                                        <div
                                                            className={
                                                                styles.cellActions
                                                            }
                                                        >
                                                            <button
                                                                className={
                                                                    styles.deleteButton
                                                                }
                                                                onClick={() =>
                                                                    setProductToDelete(
                                                                        {
                                                                            id: item
                                                                                .producto
                                                                                .id,
                                                                            nombre: item
                                                                                .producto
                                                                                .nombre,
                                                                        }
                                                                    )
                                                                }
                                                                disabled={
                                                                    deletingId ===
                                                                    item.producto.id
                                                                }
                                                                title="Eliminar producto"
                                                            >
                                                                <FiTrash2 size={14} />
                                                                {deletingId ===
                                                                    item.producto.id
                                                                    ? "Eliminando..."
                                                                    : "Eliminar"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.totalRow}>
                                    <span>Total</span>
                                    <span>
                                        {formatPrice(String(totalProducts))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delete modal */}
                    {productToDelete && (
                        <div className={styles.modalOverlay}>
                            <div className={styles.modalCard}>
                                <div className={styles.modalTitle}>
                                    Eliminar producto
                                </div>

                                <div className={styles.modalTextCard}>
                                    <p className={styles.modalText}>
                                        ¿Estás seguro de que deseas eliminar{" "}
                                        <strong>{productToDelete.nombre}</strong>{" "}
                                        de la licitación? Esta acción no se puede
                                        deshacer.
                                    </p>
                                </div>

                                <div className={styles.modalActions}>
                                    <button
                                        className={styles.modalCancelButton}
                                        onClick={() => setProductToDelete(null)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className={styles.modalConfirmButton}
                                        onClick={confirmDeleteProduct}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}