import { MarketingNavbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Partners } from "@/components/marketing/Partners";
import { ValueProps } from "@/components/marketing/ValueProps";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-primary/30 selection:text-primary">
      <MarketingNavbar />
      
      <div className="relative">
        <Hero />
        <Features />
        <HowItWorks />
        <Partners />
        <ValueProps />
      </div>

      <footer className="py-12 border-t border-white/5 bg-background/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">PDFox</span>
              <span className="text-sm text-muted-foreground ml-2">© 2026 PDFox Inc.</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-white transition-colors">Product</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
