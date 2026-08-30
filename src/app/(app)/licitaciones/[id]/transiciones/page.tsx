import BidHistoryClient from "./bidHistoryClient";

export default async function BidHistoryPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    return <BidHistoryClient bidId={id} />;
}