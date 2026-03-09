"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AnimatedTabContentProps {
  children: React.ReactNode;
  tabKey: string;
}

export function AnimatedTabContent({ children, tabKey }: AnimatedTabContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
