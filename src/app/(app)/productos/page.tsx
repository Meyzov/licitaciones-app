import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import ProductsClient from "./productsClient";

export default async function ProductsPage() {
    const currentUser = await getAuthenticatedUser();

    if (!currentUser) {
        redirect("/auth/login");
    }

    return <ProductsClient />;
}