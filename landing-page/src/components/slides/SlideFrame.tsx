"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlideFrameProps {
  children: React.ReactNode;
  direction: number; // 1 for forward, -1 for backward
}

// 16:9 Widescreen Slide Container with Responsive Scaling & Smooth Page Transitions
export const SlideFrame: React.FC<SlideFrameProps> = ({ children, direction }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Dynamically calculate scale factor so 16:9 slide uses maximum available space
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const availableWidth = window.innerWidth - 32; // Minimal 16px side margin
        const availableHeight = window.innerHeight - 96; // Minimal bottom margin for controls

        const scaleX = availableWidth / 1920;
        const scaleY = availableHeight / 1080;

        setScale(Math.min(scaleX, scaleY));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1200 : -1200,
      opacity: 0,
      scale: 0.96,
      filter: "blur(4px)",
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1200 : -1200,
      opacity: 0,
      scale: 0.96,
      filter: "blur(4px)",
    }),
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex items-center justify-center w-full h-full relative overflow-hidden bg-[#eceff4]"
    >
      <div 
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'absolute'
        }}
        className="rounded-2xl shadow-2xl overflow-hidden border-2 border-[#d8dee9] bg-[#eceff4] flex flex-col"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key="active-slide-wrapper"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 220, damping: 28 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
              filter: { duration: 0.3 }
            }}
            className="w-full h-full absolute inset-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
