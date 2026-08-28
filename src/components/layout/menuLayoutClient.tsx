"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import TopPanel from "./topPanel";
import SidePanel from "./sidePanel";
import styles from "./menuLayoutClient.module.css";

type User = {
    name: string;
    email: string;
    role: string;
};

type MenuLayoutClientProps = {
    children: React.ReactNode;
    user: User;
    initialExpanded: boolean;
};

export default function MenuLayoutClient({ children, user, initialExpanded }: MenuLayoutClientProps) {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);

    const handleToggle = () => {
        setIsExpanded((prev) => {
            const newState = !prev;
            document.cookie = `sidebar_expanded=${newState}; path=/; max-age=31536000; SameSite=Lax`;
            return newState;
        });
    };

    return (
        <div className={styles.shell}>
            <SidePanel isExpanded={isExpanded} setIsExpanded={handleToggle} />

            <div className={styles.mainColumn}>
                <TopPanel user={user} />

                <main className={styles.contentArea}>
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={styles.pageTransition} >

                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}