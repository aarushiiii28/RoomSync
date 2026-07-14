import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/how-it-works.tsx";
import Features from "@/components/landing/features";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full">
        <div className="text-center pt-20 pb-4">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-pink-400 mb-3">Process</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">How It Works</h2>
        </div>
        <HowItWorks />
      </section>

      {/* Features Section */}
      <Features />
    </>
  );
}