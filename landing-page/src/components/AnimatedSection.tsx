"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  id,
  className = "",
}) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`scroll-mt-24 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center ${className}`}
    >
      {children}
    </motion.section>
  );
};
