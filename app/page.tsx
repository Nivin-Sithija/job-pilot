import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/homepage/Hero";
import { HowItWorks } from "@/components/homepage/HowItWorks";
import { Features } from "@/components/homepage/Features";
import { Testimonial } from "@/components/homepage/Testimonial";
import { CTASection } from "@/components/homepage/CTASection";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function Home() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();
  const ctaHref = data.user ? "/dashboard" : "/login";

  return (
    <>
      <Navbar ctaHref={ctaHref} />
      <main>
        <Hero ctaHref={ctaHref} />
        <HowItWorks />
        <Features />
        <Testimonial />
        <CTASection ctaHref={ctaHref} />
      </main>
      <Footer />
    </>
  );
}
