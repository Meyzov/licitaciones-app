import BidProductsClient from "./bidProductsClient";

export default async function BidProductsPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    return <BidProductsClient bidId={id} />;
}