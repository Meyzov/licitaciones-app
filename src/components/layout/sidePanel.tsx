"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    Package,
    FileSpreadsheet,
    UserCheck,
    Settings,
    Menu,
    LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/auth/logout/actions";
import styles from "./sidePanel.module.css";

type User = {
    name: string;
    email: string;
    role: string;
};

type SidePanelProps = {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    user: User;
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

export default function SidePanel({ isExpanded, setIsExpanded, user }: SidePanelProps) {
    const pathname = usePathname();
    const isAnimatingRef = useRef(false);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    },
        []);

    const handleToggle = () => {
        if (isAnimatingRef.current) return;
        setIsExpanded(!isExpanded);
    };

    const userName = user?.name || "Usuario";
    const initial = userName.charAt(0).toUpperCase();
    const roleLabel = user?.role === "admin" ? "Administrador" : "Usuario";
    const effectiveExpanded = isExpanded;

    return (
        <>
            <div className={styles.mobileFloatingTrigger}>
                <div className={styles.sidebarPanel}>
                    <div className={styles.sidebarGroupCard}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggle();
                            }}
                            className={styles.toggleButton}
                            aria-label="Expandir o colapsar menú lateral" >

                            <div className={`${styles.itemContent} ${styles.itemContentNoGap}`}>
                                <Menu size={18} className={styles.itemIcon} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {isMobile && isExpanded && (
                <div
                    onClick={() => {
                        if (!isAnimatingRef.current) setIsExpanded(false);
                    }}
                    className={styles.mobileBackdrop} >
                </div>
            )}

            <motion.aside
                initial={false}
                animate={{
                    width: isMobile ? 200 : (effectiveExpanded ? 200 : 66),
                    x: isMobile && !isExpanded ? "-120%" : 0,
                }}

                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                onAnimationStart={() => {
                    isAnimatingRef.current = true;
                }}

                onAnimationComplete={() => {
                    isAnimatingRef.current = false;
                }}

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
                    {NAV_SECTIONS.map(({ title, items }) => {
                        const isAutoMargin = title === null;

                        const groupCardClasses = [
                            styles.sidebarGroupCard,
                            !effectiveExpanded ? styles.sidebarGroupCardCollapsed : "",
                            isAutoMargin ? styles.sidebarGroupCardAuto : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        return (
                            <div key={title ?? "no-title"} className={groupCardClasses}>
                                {title && (
                                    <SectionHeader isExpanded={effectiveExpanded}>
                                        {title}
                                    </SectionHeader>
                                )}
                                <ul className={styles.itemList}>
                                    {items.map((item) => (
                                        <SidebarLink
                                            key={item.href}
                                            item={item}
                                            pathname={pathname}
                                            isExpanded={effectiveExpanded}
                                            onLinkClick={() => {
                                                if (isMobile) {
                                                    setIsExpanded(false);
                                                }
                                            }} />
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {isMobile && effectiveExpanded && (
                    <div className={styles.sidebarGroupCardProfile}>
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
                )}
            </motion.aside>
        </>
    );
}

function SidebarLink({ item, pathname, isExpanded, onLinkClick, }: { item: NavItem; pathname: string; isExpanded: boolean; onLinkClick?: () => void; }) {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
        <li>
            <Link
                href={item.href}
                className={styles.itemLink}
                title={!isExpanded ? item.label : undefined}
                onClick={onLinkClick} >

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