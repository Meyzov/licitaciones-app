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
    Clock,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/logout/actions";
import styles from "./topPanel.module.css";

type User = {
    name: string;
    email: string;
    role: string;
};

type TopPanelProps = {
    user: User;
};

type PageInfo = {
    title: string;
    Icon: React.ElementType;
};

const PAGE_INFO_BY_PREFIX: Array<{ prefix: string; info: PageInfo }> = [
    { prefix: "/dashboard", info: { title: "Dashboard", Icon: LayoutDashboard } },
    { prefix: "/licitaciones", info: { title: "Licitaciones", Icon: FileText } },
    { prefix: "/productos", info: { title: "Productos", Icon: Package } },
    { prefix: "/clientes", info: { title: "Clientes", Icon: Building2 } },
    { prefix: "/usuarios", info: { title: "Usuarios", Icon: Users } },
    { prefix: "/configuracion", info: { title: "Configuración", Icon: Settings } },
];

const DEFAULT_PAGE_INFO: PageInfo = { title: "Panel", Icon: Layout };

function getPageInfo(pathname: string): PageInfo {
    const match = PAGE_INFO_BY_PREFIX.find(({ prefix }) => pathname.startsWith(prefix));
    return match?.info ?? DEFAULT_PAGE_INFO;
}

function useLiveDateTime() {
    const [dateTime, setDateTime] = useState({ date: "", time: "" });

    useEffect(() => {
        const dateFormatter = new Intl.DateTimeFormat("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        const timeFormatter = new Intl.DateTimeFormat("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        const update = () => {
            const now = new Date();
            setDateTime({ date: dateFormatter.format(now), time: timeFormatter.format(now) });
        };

        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    },
    []);

    return dateTime;
}

export default function TopPanel({ user }: TopPanelProps) {
    const pathname = usePathname();
    const { date, time } = useLiveDateTime();

    const userName = user?.name || "Usuario";
    const initial = userName.charAt(0).toUpperCase();
    const roleLabel = user?.role === "admin" ? "Administrador" : "Usuario";

    const { title, Icon } = getPageInfo(pathname);

    return (
        <div className={styles.topBarWrapper}>
            <header className={styles.topHeaderCard}>
                <div className={styles.pageTitleCard}>
                    <Icon size={18} className={styles.pageTitleIcon} />
                    <span className={styles.pageTitleText}>
                        {title}
                    </span>
                </div>

                <div className={styles.pageTitleCard}>
                    <Clock size={16} className={styles.pageTitleIcon} />
                    <span className={styles.dateTimeText}>
                        {
                            date ? (
                                <>
                                    {date}
                                    <span className={styles.dateTimeSeparator}>
                                        |
                                    </span>
                                    {time}
                                </>
                            ) : ("Cargando...")
                        }
                    </span>
                </div>
            </header>

            <div className={styles.userCard}>
                <div className={styles.avatar}>
                    {initial}
                </div>

                <div className={styles.userInfo}>
                    <span className={styles.userName}>
                        {userName}
                    </span>

                    <span className={styles.userRole}>
                        {roleLabel}
                    </span>
                </div>

                <form action={logoutAction} className={styles.logoutForm}>
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