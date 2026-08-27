"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    Package,
    FileSpreadsheet,
    UserCheck,
    Settings,
    Menu,
} from "lucide-react";
import styles from "@/app/dashboard/layout.module.css";

type SidePanelProps = {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
};

const generalSection = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const managementSection = [
    { label: "Licitaciones", href: "/licitaciones", icon: FileSpreadsheet },
    { label: "Productos", href: "/productos", icon: Package },
    { label: "Clientes", href: "/clientes", icon: Users },
];

const systemSection = [
    { label: "Usuarios", href: "/usuarios", icon: UserCheck },
];

const configSection = [
    { label: "Configuración", href: "/configuracion", icon: Settings },
];


export default function SidePanel({ isExpanded, setIsExpanded }: SidePanelProps) {
    const pathname = usePathname();

    const renderSidebarItem = (item: { label: string; href: string; icon: React.ElementType }) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
            <li key={item.href}>
                <Link href={item.href} className={styles.sidebarItemLink} title={!isExpanded ? item.label : undefined}>
                    <div className={`${styles.sidebarItemContent} ${isActive ? styles.activeSidebarItem : ""}`}>
                        <Icon size={18} className={styles.sidebarIcon} />
                        <motion.span
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? "auto" : 0 }}
                            transition={{ duration: 0.15, ease: "easeInOut" }}
                            className={styles.sidebarText}
                            style={{ pointerEvents: isExpanded ? "auto" : "none", overflow: "hidden" }} >

                            {item.label}
                        </motion.span>
                    </div>
                </Link>
            </li>
        );
    };

    const renderSectionHeader = (title: string) => (
        <motion.div
            initial={false}
            animate={{
                height: isExpanded ? "auto" : 0,
                opacity: isExpanded ? 1 : 0,
                padding: isExpanded ? "6px 10px 4px 10px" : "0px",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
            className={styles.sidebarSectionHeader} >

            <span className={styles.sidebarSectionTitle}>{title}</span>
        </motion.div>
    );

    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 200 : 66 }}
            style={{
                width: isExpanded ? 200 : 66,
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                flexShrink: 0,
                overflow: "hidden",
            }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }} >

            <div className={styles.sidebar}>
                <div className={styles.sidebarGroupCard}>
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            width: "100%",
                        }}
                        aria-label="Expandir o colapsar menú lateral" >

                        <div className={styles.sidebarItemContent}>
                            <Menu size={18} className={styles.sidebarIcon} />
                            <motion.span
                                initial={false}
                                animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? "auto" : 0 }}
                                transition={{ duration: 0.15, ease: "easeInOut" }}
                                className={styles.sidebarText}
                                style={{ pointerEvents: isExpanded ? "auto" : "none", overflow: "hidden" }} >

                                Menú
                            </motion.span>
                        </div>
                    </button>
                </div>
            </div>

            <div
                className={styles.sidebar}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    gap: "8px",
                    overflowY: "auto",
                    overflowX: "hidden",
                }} >

                <div className={styles.sidebarGroupCard} style={{ gap: isExpanded ? "4px" : "0px" }}>
                    {renderSectionHeader("General")}
                    <ul className={styles.sidebarList}>
                        {generalSection.map(renderSidebarItem)}
                    </ul>
                </div>

                <div className={styles.sidebarGroupCard} style={{ gap: isExpanded ? "4px" : "0px" }}>
                    {renderSectionHeader("Gestión")}
                    <ul className={styles.sidebarList}>
                        {managementSection.map(renderSidebarItem)}
                    </ul>
                </div>

                <div className={styles.sidebarGroupCard} style={{ gap: isExpanded ? "4px" : "0px" }}>
                    {renderSectionHeader("Sistema")}
                    <ul className={styles.sidebarList}>
                        {systemSection.map(renderSidebarItem)}
                    </ul>
                </div>

                <div className={styles.sidebarGroupCard} style={{ marginTop: "auto", gap: isExpanded ? "4px" : "0px" }}>
                    <ul className={styles.sidebarList}>
                        {configSection.map(renderSidebarItem)}
                    </ul>
                </div>
            </div>
        </motion.aside>
    );
}