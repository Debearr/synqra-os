"use client";

import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <section key={i} className="glassmorphism p-5 hover:glow-teal transition-transform duration-300 hover:-translate-y-0.5">
          <h3 className="text-lg font-semibold">Panel {i}</h3>
          <p className="mt-2 text-sm text-silver-mist/80">
            This is a glassmorphism card with teal glow on hover.
          </p>
        </section>
      ))}
    </motion.main>
  );
}
