"use client";

import { logoutAction } from "@/app/auth/logout/actions";

export default function DashboardPage() {
    return (
        <div>
            <h1>Dashboard - Bienvenido</h1>
            <form action={logoutAction}>
                <button type="submit">Cerrar sesión</button>
            </form>
        </div>
    );
}