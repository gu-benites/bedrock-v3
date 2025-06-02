import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const services = [
  {
    title: 'Personalized Planning',
    description: 'Tailored event and travel planning to meet your unique needs.',
    imageSrc: 'https://placehold.co/600x400.png',
    imageHint: 'event planning travel',
    href: '/services/planning',
  },
  {
    title: 'Lifestyle Management',
    description: 'Efficiently manage your daily tasks and lifestyle needs.',
    imageSrc: 'https://placehold.co/600x400.png',
    imageHint: 'lifestyle schedule organization',
    href: '/services/lifestyle',
  },
  {
    title: 'Exclusive Access',
    description: 'Unlock access to premium events, reservations, and experiences.',
    imageSrc: 'https://placehold.co/600x400.png',
    imageHint: 'vip exclusive luxury',
    href: '/services/access',
  },
];

export default function FeaturedServicesSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Our Premier Services
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            Discover how we can elevate your lifestyle and simplify your world.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title} className="overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image 
                    src={service.imageSrc} 
                    alt={service.title} 
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={service.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="font-headline text-xl mb-2">{service.title}</CardTitle>
                <CardDescription className="mb-4 text-base">{service.description}</CardDescription>
                <Button asChild variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
                  <Link href={service.href}>
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
