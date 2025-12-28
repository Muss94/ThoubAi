'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleStartJourney = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin?callbackUrl=/dashboard');
    }
  };

  return (
    <div className="relative bg-black overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center pb-32 overflow-hidden">
        {/* Hero Background with Parallax effect */}
        <div
          className="absolute inset-0 z-0 opacity-80 scale-105"
          style={{
            backgroundImage: 'url("/hero-bg.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(1.1)'
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black z-10" />

        {/* Content */}
        <main className="relative z-20 text-center px-6 max-w-4xl animate-fade-in mt-20">
          <div className="mb-6 inline-block">
            <span className="text-primary tracking-[0.4em] text-sm uppercase animate-gold-glow">High-Artisan Fashion Tech</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 gold-gradient-text drop-shadow-2xl">
            THOUB AI
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Experience the world's first <span className="text-white">Zero-Touch Bespoke Tailoring</span>.
            Powered by Computer Vision and the Neural Mirror for a fit that is uniquely yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handleStartJourney}
              className="btn-primary w-full sm:w-auto px-10 py-5 rounded-full text-lg group overflow-hidden relative"
            >
              <span className="relative z-10">START YOUR JOURNEY</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>

            <button className="text-white/50 hover:text-white transition-colors text-sm uppercase tracking-widest border-b border-white/10 pb-1">
              Discover the Craft
            </button>
          </div>
        </main>

        {/* Repositioned Branding: Bottom Right */}
        <div className="absolute bottom-10 right-10 animate-reveal z-30" style={{ animationDelay: '1.2s' }}>
          <div className="flex items-center gap-4 bg-[#f8f8f8] px-5 py-1.5 rounded-2xl border border-white/20 group hover:scale-105 transition-all shadow-2xl">
            <div className="flex flex-col">
              <p className="text-[7px] uppercase tracking-[0.2em] text-black/40 font-black leading-none mb-1">Powered By</p>
              <span className="text-[10px] font-black tracking-[0.1em] text-black/80">INVARI.TECH</span>
            </div>
            <div className="h-6 w-[1px] bg-black/10" />
            <img src="/invari_logo.png" alt="Invari Group" className="h-10 md:h-12 object-contain" />
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute bottom-12 left-12 hidden lg:block animate-fade-in" style={{ animationDelay: '1s' }}>
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 vertical-text">NEURAL MEASUREMENT SYSTEM v2.4</p>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.6em] text-white/60 animate-reveal z-30" style={{ animationDelay: '1.4s' }}>
          <div className="flex gap-6 font-black italic">
            <span>London</span>
            <span className="text-primary opacity-60">•</span>
            <span>Riyadh</span>
            <span className="text-primary opacity-60">•</span>
            <span>Dubai</span>
          </div>
        </div>

        <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }
      `}</style>
      </div>

      {/* Testimonials Section */}
      <TestimonialsSection />
    </div>
  );
}

// Testimonials Section Component
function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isDesktop, setIsDesktop] = React.useState(true); // Default to true for SSR matches, fix in effect

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const testimonials = [
    {
      quote: "Thoub AI has completely transformed my perception of traditional wear. The precision is unmatched.",
      name: "Omar Al-Fayed",
      title: "Riyadh, KSA",
      company: "Verified Client",
      image: "/images/testimonials/t5.jpg"
    },
    {
      quote: "I ordered this for my son and the fit was perfect straight out of the box. Amazing technology.",
      name: "Amir Al-Maktoum",
      title: "Dubai, UAE",
      company: "Verified Client",
      image: "/images/testimonials/t3.jpg"
    },
    {
      quote: "The Neural Mirror fit is impeccable—better than any tailor I've visited in person. Truly the future of bespoke.",
      name: "James Sterling",
      title: "London, UK",
      company: "Verified Client",
      image: "/images/testimonials/t4.jpg"
    },
    {
      quote: "From the zero-touch measurement process to the final delivery, the experience was seamless.",
      name: "Fahad Al-Saud",
      title: "Jeddah, KSA",
      company: "Verified Client",
      image: "/images/testimonials/t2.jpg"
    }
  ];

  const itemsPerPage = isDesktop ? 2 : 1;
  const maxIndex = testimonials.length - itemsPerPage;

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <section className="relative z-20 py-32 px-6 mt-20 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-6 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/60">Client Stories</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-4">
              <span className="text-white">Trusted by the</span> <br />
              <span className="gold-gradient-text italic">Modern Gentleman</span>
            </h2>
            <p className="text-white/50 text-lg font-light max-w-lg leading-relaxed">
              Discover how Thoub AI is redefining bespoke tailoring through the lens of our distinguished clientele across the globe.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Testimonial Cards Carousel */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="w-full md:w-1/2 flex-shrink-0 px-3">
                <div className="relative group h-[600px] rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-primary/20 transition-all duration-500 ring-1 ring-primary/30 bg-white/5">
                  <img
                    alt={testimonial.name}
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 filter brightness-[0.75] group-hover:brightness-95"
                    src={testimonial.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-95" />

                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    {/* 5-Star Rating */}
                    <div className="flex gap-1 mb-4 text-primary">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                      ))}
                    </div>

                    {/* Quote Text */}
                    <p className="text-white text-lg font-light leading-relaxed mb-6 border-l-2 border-primary pl-4 italic">
                      "{testimonial.quote}"
                    </p>

                    {/* Author Info */}
                    <div className="flex justify-between items-end border-t border-white/20 pt-6">
                      <div>
                        <h4 className="text-white font-black text-lg tracking-wide">{testimonial.name}</h4>
                        <p className="text-white/60 text-xs font-light tracking-wider uppercase">{testimonial.title}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-70">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-white font-bold text-xs tracking-wider uppercase">{testimonial.company}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Footer */}
        <div className="mt-16 flex justify-center items-center gap-4 opacity-40">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-white/20" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/40 font-light">London · Riyadh · Dubai</span>
          <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-white/20" />
        </div>
      </div>
    </section>
  );
}
