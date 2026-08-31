import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import DashboardClient from "./dashboardClient";

export default async function DashboardPage() {
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
        redirect("/auth/login");
    }

    return <DashboardClient userName={currentUser.name} />;
}