import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function DynamicBackground({ children }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Use framer-motion springs for smooth interpolation
  const springX = useSpring(0, { stiffness: 50, damping: 20 });
  const springY = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      springX.set(e.clientX);
      springY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [springX, springY]);

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] text-slate-200 overflow-hidden">
      {/* Dynamic Cursor Gradient */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-screen"
        style={{
          background: `radial-gradient(circle 600px at ${springX.get()}px ${springY.get()}px, rgba(29, 78, 216, 0.15), transparent 80%)`,
        }}
        animate={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.15), transparent 80%)`,
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
      />
      
      {/* A static base gradient for extra depth */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#0a0a0a] to-[#0a0a0a]" />

      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
