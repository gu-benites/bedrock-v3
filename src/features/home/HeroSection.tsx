import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-secondary/50">
      <div className="container grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-16">
        <div className="space-y-6 text-center md:text-left">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
            Welcome to Concierge
          </h1>
          <p className="text-lg text-foreground/80 md:text-xl">
            Your personal assistant for a seamless experience. We handle the details, so you can focus on what matters most.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Button asChild size="lg" className="transition-transform hover:scale-105">
              <Link href="/services">Explore Services</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="transition-transform hover:scale-105">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-xl shadow-xl">
            <Image 
              src="https://placehold.co/800x600.png" 
              alt="Concierge service illustration" 
              layout="fill"
              objectFit="cover"
              data-ai-hint="modern professional service"
              className="transition-transform duration-500 hover:scale-105"
            />
        </div>
      </div>
    </section>
  );
}
