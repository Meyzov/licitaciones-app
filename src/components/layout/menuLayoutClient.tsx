"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import TopPanel from "./topPanel";
import SidePanel from "./sidePanel";
import styles from "@/app/dashboard/layout.module.css";

type User = {
    name: string;
    email: string;
    role: string;
};

export default function MenuLayoutClient({ children, user, initialExpanded, }: { children: React.ReactNode; user: User; initialExpanded: boolean; }) {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);

    const handleToggle = () => {
        setIsExpanded((prev) => {
            const newState = !prev;
            if (typeof window !== "undefined") {
                document.cookie = `sidebar_expanded=${newState}; path=/; max-age=31536000; SameSite=Lax`;
            }
            return newState;
        });
    };

    return (
        <div
            style={{
                display: "flex",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                padding: "16px",
                gap: "16px",
                boxSizing: "border-box"
            }} >

            <SidePanel isExpanded={isExpanded} setIsExpanded={handleToggle} />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0,
                    height: "100%",
                    gap: "16px"
                }} >

                <TopPanel user={user} />

                <main
                    className={styles.contentArea}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto"
                    }} >

                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minHeight: 0
                        }} >

                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}