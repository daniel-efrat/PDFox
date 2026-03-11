"use client";

import { motion } from "framer-motion";
import { Type, Highlighter, Crop, Layers, FileSignature } from "lucide-react";

const features = [
  {
    title: "Edit text in PDFs",
    icon: Type,
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
  },
  {
    title: "Highlight and annotate",
    icon: Highlighter,
    color: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-400",
  },
  {
    title: "Crop pages",
    icon: Crop,
    color: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
  },
  {
    title: "Extract pages",
    icon: Layers,
    color: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-400",
  },
  {
    title: "Fill and sign forms",
    icon: FileSignature,
    color: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-400",
  },
];

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Powerful PDF Editing Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`h-full p-8 rounded-2xl glass-card transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-xl bg-background/50 border border-white/5 ${feature.iconColor}`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
