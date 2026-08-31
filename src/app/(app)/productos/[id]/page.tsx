import ProductDetailClient from "./productDetailClient";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    return <ProductDetailClient productId={id} />;
}