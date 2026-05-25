import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Campaigns } from "@/components/landing/Campaigns";
import { Tatuadores } from "@/components/landing/Tatuadores";
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks").then(m => ({ default: m.HowItWorks })));
const Guarantee = lazy(() => import("@/components/landing/Guarantee").then(m => ({ default: m.Guarantee })));
const SocialProof = lazy(() => import("@/components/landing/SocialProof").then(m => ({ default: m.SocialProof })));
const Urgency = lazy(() => import("@/components/landing/Urgency").then(m => ({ default: m.Urgency })));
const FinalCTA = lazy(() => import("@/components/landing/FinalCTA").then(m => ({ default: m.FinalCTA })));
const Footer = lazy(() => import("@/components/landing/Footer").then(m => ({ default: m.Footer })));

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Campaigns />
        <Tatuadores />
        <Suspense fallback={null}>
          <HowItWorks />
          <Guarantee />
          <SocialProof />
          <Urgency />
          <FinalCTA />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
