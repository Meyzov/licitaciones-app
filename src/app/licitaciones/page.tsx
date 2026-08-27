"use client";

import { motion, Variants } from "framer-motion";
import styles from "@/app/dashboard/page.module.css";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: "easeOut" },
    },
};

export default function DashboardHomePage() {
    return (
        <motion.div
            className={styles.dashboardRoot}
            initial="hidden"
            animate="visible"
            variants={containerVariants} >

            <motion.section
                variants={itemVariants}
                className={styles.cardPanel} >

                <h2 className={styles.panelTitle}>Licitaciones</h2>
            </motion.section>
        </motion.div>
    );
}