import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27" as any,
      appInfo: {
        name: "PDFab",
        version: "0.1.0",
      },
    })
  : ({
      subscriptions: {
        create: async () => ({ id: "mock_sub" }),
        retrieve: async () => ({ id: "mock_sub" }),
      },
      customers: {
        create: async () => ({ id: "mock_cus" }),
      },
    } as any);

export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    priceId: "",
    duration: "forever",
    features: ["10 exports / month", "Core editing tools", "1 week storage"],
  },
  PRO: {
    id: "pro",
    name: "Pro",
    priceId: "price_...", // Placeholder
    duration: "month",
    features: [
      "Unlimited exports",
      "Digital signatures",
      "Page extraction",
      "Priority support",
    ],
  },
};
