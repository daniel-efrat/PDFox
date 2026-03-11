"use client";

import { motion } from "framer-motion";
import { Upload, Edit3, Share2, ChevronRight } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Upload PDF",
    description: "Select your file",
    icon: Upload,
  },
  {
    number: "2",
    title: "Edit Instantly",
    description: "Make any changes",
    icon: Edit3,
  },
  {
    number: "3",
    title: "Download or Share",
    description: "Save or share your PDF",
    icon: Share2,
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-background/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How It Works
          </h2>
        </div>

        <div className="relative flex flex-col lg:flex-row items-stretch justify-between gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="flex-1 group"
            >
              <div className="h-full p-8 rounded-2xl glass-card flex items-center gap-6 relative overflow-hidden group-hover:border-primary/30 transition-all">
                {/* Chevron Background (Visible on Desktop) */}
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 hidden lg:block text-muted-foreground/20 group-hover:text-primary/20 transition-colors">
                    <ChevronRight className="h-20 w-20 stroke-[1px]" />
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xl shrink-0">
                  {step.number}
                </div>

                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-white/80 transition-colors">
                    <step.icon className="h-4 w-4" />
                    {step.description}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
