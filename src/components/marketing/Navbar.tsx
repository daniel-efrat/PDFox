"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function MarketingNavbar() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-navbar.png"
              alt="PDFab Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              PDFab
            </span>
          </Link>
          <div className="hidden md:ml-10 md:flex md:items-center md:gap-8">
            <Link
              href="#product"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Product
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="#docs"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Docs
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="1flex items-center gap-4">
          <button
            onClick={() => router.push("/auth/sign-in")}
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Log in
          </button>
          <button
            onClick={() => router.push("/auth/sign-up")}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-white shadow shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
