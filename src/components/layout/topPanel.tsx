"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    LogOut,
    LayoutDashboard,
    FileText,
    Package,
    Building2,
    Users,
    Settings,
    Layout,
    Clock
} from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/logout/actions";
import styles from "@/app/dashboard/layout.module.css";

type User = {
    name: string;
    email: string;
    role: string;
};

type TopPanelProps = {
    user: User;
};

export default function TopPanel({ user }: TopPanelProps) {
    const pathname = usePathname();
    const userName = user?.name || "Usuario";
    const initial = userName.charAt(0).toUpperCase();
    const roleLabel = user?.role === "admin" ? "Administrador" : "Usuario";

    const [dateTime, setDateTime] = useState<{ date: string; time: string }>({ date: "", time: "" });

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const dateOptions: Intl.DateTimeFormatOptions = {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            };
            const dateString = now.toLocaleDateString('es-ES', dateOptions);
            const timeString = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            setDateTime({ date: dateString, time: timeString });
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const getPageInfo = (path: string) => {
        if (path.startsWith("/dashboard")) {
            return { title: "Dashboard", icon: <LayoutDashboard size={18} className={styles.pageTitleIcon} /> };
        }
        if (path.startsWith("/licitaciones")) {
            return { title: "Licitaciones", icon: <FileText size={18} className={styles.pageTitleIcon} /> };
        }
        if (path.startsWith("/productos")) {
            return { title: "Productos", icon: <Package size={18} className={styles.pageTitleIcon} /> };
        }
        if (path.startsWith("/clientes")) {
            return { title: "Clientes", icon: <Building2 size={18} className={styles.pageTitleIcon} /> };
        }
        if (path.startsWith("/usuarios")) {
            return { title: "Usuarios", icon: <Users size={18} className={styles.pageTitleIcon} /> };
        }
        if (path.startsWith("/configuracion")) {
            return { title: "Configuracion", icon: <Settings size={18} className={styles.pageTitleIcon} /> };
        }
        return { title: "Panel", icon: <Layout size={18} className={styles.pageTitleIcon} /> };
    };

    const pageInfo = getPageInfo(pathname);

    return (
        <div
            className={styles.topBarWrapper}
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
            }} >

            <header
                className={styles.topHeaderCard}
                style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    alignItems: "center",
                    height: "auto",
                    overflow: "visible",
                    padding: "8px 8px",
                }} >

                <div
                    className={styles.pageTitleCard}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flex: "0 1 auto",
                        minWidth: 0,
                    }} >

                    {pageInfo.icon}
                    <span className={styles.pageTitleText}>{pageInfo.title}</span>
                </div>

                <div
                    className={styles.pageTitleCard}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flex: "0 1 auto",
                        minWidth: 0,
                    }} >

                    <Clock size={16} className={styles.pageTitleIcon} />
                    <span
                        className={styles.pageTitleText}
                        style={{
                            textTransform: "capitalize",
                            whiteSpace: "nowrap",
                        }} >

                        {dateTime.date ? (
                            <>
                                {dateTime.date}
                                <span style={{ margin: "0 8px", color: "#dcd6c7", fontWeight: 300 }}>|</span>
                                {dateTime.time}
                            </>
                        ) : ("Cargando...")}
                    </span>
                </div>
            </header>

            <div
                className={styles.topHeaderCard}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "max-content",
                    flex: "0 0 auto",
                    padding: "8px 8px",
                }} >

                <div
                    className={styles.avatarEnhanced}
                    style={{
                        width: "46px",
                        height: "46px",
                        minWidth: "46px",
                        minHeight: "46px",
                        fontSize: "14px",
                        backgroundColor: "#f5f2eb",
                        color: "#2b2b2b",
                        border: "1px solid #e3decb"
                    }} >

                    {initial}
                </div>

                <div className={styles.userInfoEnhanced}>
                    <span className={styles.userName}>{userName}</span>
                    <span className={styles.userRole}>{roleLabel}</span>
                </div>

                <form action={logoutAction} style={{ display: "flex", alignItems: "center", marginLeft: "24px" }}>
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        type="submit"
                        className={styles.logoutButton}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión" >

                        <LogOut size={16} />
                    </motion.button>
                </form>
            </div>
        </div>
    );
}