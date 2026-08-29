import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import ClientsClient from "./clientsClient";

export default async function ClientsPage() {
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
        redirect("/auth/login");
    }

    return <ClientsClient />;
}