"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "QuantumCorp", icon: "⚛️" },
  { name: "Nexatech", icon: "💎" },
  { name: "Globexia", icon: "🌍" },
  { name: "Stratify", icon: "📊" },
];

export function Partners() {
  return (
    <section className="py-20 border-t border-b border-white/5 bg-background/20 overflow-hidden">
      <div className="container mx-auto px-6">
        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-12">
          Trusted by professionals worldwide
        </p>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((partner) => (
            <motion.div
              key={partner.name}
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-3xl grayscale-0">{partner.icon}</span>
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                {partner.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
