import BidDetailClient from "./bidDetailClient";

export default async function BidDetailPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    return <BidDetailClient bidId={id} />;
}