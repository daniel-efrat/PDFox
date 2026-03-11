import { PLANS } from "@/lib/billing/stripe";
import { Check, Zap, Shield, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription, view invoices, and upgrade your experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {/* Free Plan */}
        <div className="p-8 rounded-2xl border border-border bg-card flex flex-col shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Free</h2>
            <p className="text-muted-foreground text-sm">Perfect for individuals just starting out.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold">$0</span>
            <span className="text-muted-foreground ml-2 text-sm">/ month</span>
          </div>
          <div className="space-y-4 mb-10 flex-1">
            {PLANS.FREE.features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors disabled:opacity-50 cursor-default" disabled>
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-8 rounded-2xl border-2 border-primary bg-background flex flex-col shadow-xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">
            Recommended
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              Pro
              <Zap className="h-4 w-4 text-primary fill-primary" />
            </h2>
            <p className="text-muted-foreground text-sm">Advanced features for power users.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-extrabold">$19</span>
            <span className="text-muted-foreground ml-2 text-sm">/ month</span>
          </div>
          <div className="space-y-4 mb-10 flex-1">
            {PLANS.PRO.features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm font-medium">
                <Check className="h-4 w-4 text-primary" />
                {feature}
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
            Upgrade to Pro
          </button>
        </div>
      </div>

      <div className="p-8 rounded-2xl border border-border bg-card/60 space-y-6">
        <h3 className="font-bold">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Can I cancel anytime?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Yes, you can cancel your subscription at any time from your settings. No hidden fees or questions asked.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Will my PDFs be safe?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Absolutely. We use industry-standard encryption and secure storage to ensure your documents are private and safe.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Is there a student discount?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">We offer special pricing for students and educators. Contact our support team with your EDU email.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Do you offer API access?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">API access is currently in invitation-only beta for Team and Enterprise users.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
