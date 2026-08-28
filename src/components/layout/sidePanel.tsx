"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
import styles from "./sidePanel.module.css";

type SidePanelProps = {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
};

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
};

const NAV_SECTIONS: Array<{ title: string | null; items: NavItem[] }> = [
    { title: "General", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
    {
        title: "Gestión",
        items: [
            { label: "Licitaciones", href: "/licitaciones", icon: FileSpreadsheet },
            { label: "Productos", href: "/productos", icon: Package },
            { label: "Clientes", href: "/clientes", icon: Users },
        ],
    },
    { title: "Sistema", items: [{ label: "Usuarios", href: "/usuarios", icon: UserCheck }] },
    { title: null, items: [{ label: "Configuración", href: "/configuracion", icon: Settings }] },
];

export default function SidePanel({ isExpanded, setIsExpanded }: SidePanelProps) {
    const pathname = usePathname();

    const [isAndroid] = useState(() => {
        if (typeof window === "undefined") return false;
        const userAgent = String(navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || "");
        return /android/i.test(userAgent);
    });

    const effectiveExpanded = isAndroid ? false : isExpanded;

    const handleToggle = () => {
        if (isAndroid) return;
        setIsExpanded(!isExpanded);
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: effectiveExpanded ? 200 : 66 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className={styles.asideWrapper} >

            <div className={styles.sidebarPanel}>
                <div className={styles.sidebarGroupCard}>
                    <button
                        type="button"
                        onClick={handleToggle}
                        className={styles.toggleButton}
                        aria-label="Expandir o colapsar menú lateral" >

                        <div className={styles.itemContent}>
                            <Menu size={18} className={styles.itemIcon} />

                            <AnimatedLabel isExpanded={effectiveExpanded}>
                                Menú
                            </AnimatedLabel>
                        </div>
                    </button>
                </div>
            </div>

            <div className={`${styles.sidebarPanel} ${styles.sidebarPanelScrollable}`}>
                {NAV_SECTIONS.map(({ title, items }) => (
                    <div
                        key={title ?? "no-title"}
                        className={styles.sidebarGroupCard}
                        style={{ gap: effectiveExpanded ? "4px" : "0px", marginTop: title === null ? "auto" : undefined }} >

                        {title && <SectionHeader isExpanded={effectiveExpanded}>{title}</SectionHeader>}
                        <ul className={styles.itemList}>
                            {items.map((item) => (
                                <SidebarLink key={item.href} item={item} pathname={pathname} isExpanded={effectiveExpanded} />
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </motion.aside>
    );
}

function SidebarLink({ item, pathname, isExpanded, }: { item: NavItem; pathname: string; isExpanded: boolean; }) {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
        <li>
            <Link href={item.href} className={styles.itemLink} title={!isExpanded ? item.label : undefined}>
                <div className={`${styles.itemContent} ${isActive ? styles.itemActive : ""}`}>
                    <Icon size={18} className={styles.itemIcon} />
                    <AnimatedLabel isExpanded={isExpanded}>
                        {item.label}
                    </AnimatedLabel>
                </div>
            </Link>
        </li>
    );
}

function AnimatedLabel({ isExpanded, children }: { isExpanded: boolean; children: React.ReactNode }) {
    return (
        <motion.span
            initial={false}
            animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? "auto" : 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className={styles.itemLabel}
            style={{ pointerEvents: isExpanded ? "auto" : "none" }} >

            {children}
        </motion.span>
    );
}

function SectionHeader({ isExpanded, children }: { isExpanded: boolean; children: React.ReactNode }) {
    return (
        <motion.div
            initial={false}
            animate={{
                height: isExpanded ? "auto" : 0,
                opacity: isExpanded ? 1 : 0,
                padding: isExpanded ? "6px 10px 4px 10px" : "0px",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={styles.sectionHeader} >

            <span className={styles.sectionTitle}>
                {children}
            </span>
        </motion.div>
    );
}