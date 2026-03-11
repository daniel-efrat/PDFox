"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Globe, MousePointerClick } from "lucide-react";

const props = [
  {
    title: "Fast",
    description: "Lightning quick editing.",
    icon: Zap,
  },
  {
    title: "Secure",
    description: "Your files are protected.",
    icon: Shield,
  },
  {
    title: "Works in Browser",
    description: "No apps needed.",
    icon: Globe,
  },
  {
    title: "No Installation",
    description: "Get started immediately.",
    icon: MousePointerClick,
  },
];

export function ValueProps() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {props.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-8 rounded-2xl glass-card border-transparent hover:border-white/10 transition-all hover:bg-card/60"
            >
              <h3 className="text-lg font-bold text-white mb-2">{prop.title}</h3>
              <p className="text-sm text-muted-foreground">{prop.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 text-center">
           <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-12">
              Start Editing PDFs Now
           </h2>
           <button className="px-12 py-5 rounded-2xl bg-primary text-white font-bold text-xl orange-gradient transition-all hover:scale-105 active:scale-95">
              Upload a PDF
           </button>
        </div>
      </div>
    </section>
  );
}
