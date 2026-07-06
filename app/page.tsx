"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import SplashScreen from "./components/ui/SplashScreen";
import HeroSection from "./components/sections/HeroSection";
import FeaturesSection from "./components/sections/FeaturesSection";
import JobPreviewSection from "./components/sections/JobPreviewSection";
import PassportPreviewSection from "./components/sections/PassportPreviewSection";
import BadgesPreviewSection from "./components/sections/BadgesPreviewSection";
import CTASection from "./components/sections/CTASection";
import FadeInSection from "./components/ui/FadeInSection";
import LoggedInHome from "./components/sections/LoggedInHome";
import EmployerHome from "./components/sections/EmployerHome";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Admin tidak punya beranda user — langsung ke panel admin
  useEffect(() => {
    if (user?.role === "admin") router.replace("/admin");
  }, [user, router]);

  if (user?.role === "admin") return null;

  if (user) {
    const isEmployer = user.role === "employer" || user.role === "event_organizer";
    return (
      <>
        <SplashScreen />
        <Header />
        <main>
          {isEmployer ? <EmployerHome /> : <LoggedInHome />}
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SplashScreen />
      <Header />
      <main>
        <HeroSection />
        <FadeInSection delay={0}>
          <FeaturesSection />
        </FadeInSection>
        <FadeInSection delay={50}>
          <JobPreviewSection />
        </FadeInSection>
        <FadeInSection delay={0}>
          <PassportPreviewSection />
        </FadeInSection>
        <FadeInSection delay={50}>
          <BadgesPreviewSection />
        </FadeInSection>
        <FadeInSection delay={0}>
          <CTASection />
        </FadeInSection>
      </main>
      <Footer />
    </>
  );
}
