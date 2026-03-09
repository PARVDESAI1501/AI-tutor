"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position values
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth spring physics for rotation
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), springConfig);

  // Spotlight gradient positioning
  const spotlightX = useSpring(useTransform(mouseX, [0, 1], [0, 100]), springConfig);
  const spotlightY = useSpring(useTransform(mouseY, [0, 1], [0, 100]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Calculate relative mouse position (0 to 1)
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset to center
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={cn("relative w-full h-full", className)}
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative rounded-2xl border border-border/50 bg-card shadow-lg"
      >
        {/* Spotlight Glare Effect */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 rounded-2xl opacity-0 transition-opacity duration-300 mix-blend-overlay"
          style={{
            opacity: isHovered ? 0.8 : 0,
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) => `radial-gradient(600px circle at ${x}% ${y}%, rgba(255,255,255,0.1), transparent 40%)`
            ),
          }}
        />
        
        {/* 3D Inner Content */}
        <div style={{ transform: "translateZ(30px)" }} className="w-full h-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
