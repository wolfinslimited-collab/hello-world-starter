import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div className="flex relative flex-col items-center justify-center h-[88vh] w-full bg-white dark:bg-[#09090b] transition-colors duration-300 px-6 overflow-hidden">
      {/* Animated Astronaut Illustration */}
      <div className="relative">
        {/* Floating Stars / Background Particles */}
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-10 -left-10 text-neutral-300 dark:text-neutral-700"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </motion.div>

        {/* Main Astronaut SVG */}
        <motion.div
          animate={{
            y: [0, -25, 0],
            rotate: [-1, 1, -1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            width="280"
            height="280"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-neutral-900 dark:text-neutral-100"
          >
            {/* Astronaut Body */}
            <rect
              x="60"
              y="60"
              width="80"
              height="90"
              rx="30"
              stroke="currentColor"
              strokeWidth="4"
            />
            <rect
              x="75"
              y="75"
              width="50"
              height="40"
              rx="10"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Helmet Visor Reflection */}
            <path
              d="M85 85C85 85 90 80 100 80"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Arms */}
            <path
              d="M60 100C40 100 40 120 40 120"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M140 100C160 100 160 80 160 80"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Legs */}
            <path
              d="M80 150V180"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M120 150V180"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Antenna */}
            <path
              d="M100 60V40M100 40H110"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </div>

      {/* Text Content */}
      <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">
        Page Not Found
      </h1>

      <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium max-w-sm text-center leading-relaxed">
        Lost in space? The page you're looking for has drifted out of orbit.
      </p>

      {/* Button Styles based on your requirements */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-12"
      >
        <Link
          to="/"
          className="px-10 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 
                     bg-black text-white hover:bg-neutral-800
                     dark:bg-white dark:text-black dark:hover:bg-neutral-200
                     shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
        >
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
