"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-sky-900/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full -z-10" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Edit PDFs the{" "}
                <span className="text-primary italic">Clever</span> Way
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Crop, sign, annotate, and organize PDFs instantly in your
                browser. Full-featured, lightning-fast, and completely secure.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg orange-gradient transition-all hover:scale-105 active:scale-95"
              >
                Edit Your PDF
              </Link>
              <button className="px-8 py-4 rounded-xl bg-card/40 backdrop-blur-sm border border-border text-white font-bold text-lg hover:bg-card/60 transition-all">
                Try Demo
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 w-full max-w-3xl relative"
          >
            <div className="relative rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl glass-card">
              <div className="relative overflow-hidden rounded-xl">
                <Image
                  src="/editor-mockup.png"
                  alt="PDFab Editor Interface"
                  width={1000}
                  height={700}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
