import ClientDetailClient from "./clientDetailClient";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    return <ClientDetailClient clientId={id} />;
}