import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/features/home/HeroSection';
import FeaturedServicesSection from '@/features/home/FeaturedServicesSection';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedServicesSection />
        {/* You can add more sections here as needed */}
      </main>
      <Footer />
    </div>
  );
}
