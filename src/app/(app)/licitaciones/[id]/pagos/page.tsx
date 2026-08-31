import BidPaymentsClient from "./bidPaymentsClient";

export default async function BidPaymentsPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    return <BidPaymentsClient bidId={id} />;
}