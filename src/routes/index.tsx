import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Campaigns } from "@/components/landing/Campaigns";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Guarantee } from "@/components/landing/Guarantee";
import { SocialProof } from "@/components/landing/SocialProof";
import { Urgency } from "@/components/landing/Urgency";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

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
        <HowItWorks />
        <Guarantee />
        <SocialProof />
        <Urgency />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
