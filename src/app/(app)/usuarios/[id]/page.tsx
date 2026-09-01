import UserDetailClient from "./userDetailClient";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }>; }) {
    const { id } = await params;
    return <UserDetailClient userId={id} />;
}