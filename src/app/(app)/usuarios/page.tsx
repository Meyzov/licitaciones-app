import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import UsersClient from "./usersClient";

export default async function UsersPage() {
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
        redirect("/auth/login");
    }

    return <UsersClient isAdmin={currentUser.role === "admin"} />;
}