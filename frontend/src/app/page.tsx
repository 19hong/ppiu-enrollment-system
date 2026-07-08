'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  BookOpen, GraduationCap, Globe, Building2,
  ChevronRight, Mail, Phone, MapPin, ArrowRight,
  Award, Users, BookMarked, HeartHandshake,
  Quote, Menu, X, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Home', href: '#' },
    { label: 'Programs', href: '#programs' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg ${scrolled ? 'text-primary' : 'text-white'}`}>
              PPIU
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  scrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                {l.label}
              </a>
            ))}
            <Link href="/login">
              <Button variant={scrolled ? 'default' : 'outline'} size="sm"
                className={scrolled ? '' : 'border-white/30 text-white hover:bg-white/10'}>
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Apply Now
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className={`w-6 h-6 ${scrolled ? 'text-gray-800' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-800' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-4 space-y-3">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-gray-700 hover:text-primary"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Apply Now</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-6"
          >
            <CheckCircle className="w-4 h-4 text-accent" />
            Accredited by the Ministry of Education
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
            Phnom Penh{' '}
            <span className="text-accent">International</span>{' '}
            University
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            Shaping the Future Through Quality Education — Empowering students with
            knowledge, skills, and global perspectives to thrive in an interconnected world.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/register">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 gap-2 shadow-lg shadow-accent/25">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
            <a href="#programs">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base px-8">
                Learn More
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: BookOpen,
    title: 'Modern Curriculum',
    description: 'Industry-aligned programs designed with input from leading academics and professionals.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Award,
    title: 'Expert Lecturers',
    description: 'Learn from distinguished faculty with extensive academic and industry experience.',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: Globe,
    title: 'Global Opportunities',
    description: 'International exchange programs and partnerships with universities worldwide.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Building2,
    title: 'Modern Facilities',
    description: 'State-of-the-art campuses equipped with advanced learning technologies.',
    color: 'from-violet-500 to-violet-600',
  },
];

function Features() {
  return (
    <section className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Why Choose{' '}
            <span className="text-primary">PPIU</span>?
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            We provide a world-class education that prepares students for successful careers.
          </p>
        </ScrollReveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const programs = [
  { level: 'Associate', icon: BookMarked, duration: '2 Years', desc: 'Foundation programs for career readiness.' },
  { level: 'Bachelor', icon: GraduationCap, duration: '4 Years', desc: 'Comprehensive undergraduate degrees.' },
  { level: 'Master', icon: Award, duration: '2 Years', desc: 'Advanced graduate programs.' },
  { level: 'Doctorate', icon: BookOpen, duration: '3-5 Years', desc: 'Research-focused doctoral programs.' },
];

function Programs() {
  return (
    <section id="programs" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Academic{' '}
            <span className="text-primary">Programs</span>
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Choose from a wide range of programs designed to meet your academic and career goals.
          </p>
        </ScrollReveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {programs.map((p) => (
            <motion.div
              key={p.level}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                <p.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{p.level}</h3>
              <p className="text-sm text-accent font-medium mb-3">{p.duration}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
              <div className="mt-4 flex items-center text-sm text-primary font-medium gap-1 group-hover:gap-2 transition-all">
                Learn More <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end]);

  return (
    <span ref={ref} className="text-4xl lg:text-5xl font-bold text-white">
      {count}{suffix}
    </span>
  );
}

const stats = [
  { value: 20, suffix: '+', label: 'Years Established' },
  { value: 15000, suffix: '+', label: 'Students' },
  { value: 50, suffix: '+', label: 'Programs' },
  { value: 100, suffix: '+', label: 'Partners' },
];

function Statistics() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-r from-primary to-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="text-center"
            >
              <AnimatedCounter end={s.value} suffix={s.suffix} />
              <p className="mt-2 text-white/80 text-lg">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-32 h-32 text-primary/30" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-36 h-36 rounded-2xl bg-accent flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent-foreground">15K+</p>
                  <p className="text-xs font-medium text-accent-foreground/80">Students</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              About{' '}
              <span className="text-primary">Our University</span>
            </h2>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Phnom Penh International University (PPIU) is a premier institution dedicated to
              academic excellence, research innovation, and community engagement. Since our
              founding, we have been committed to providing quality education that meets
              international standards.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Our diverse community of scholars, researchers, and students from across the globe
              creates a vibrant learning environment where ideas flourish and leaders are made.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { label: 'Programs', value: '50+' },
                { label: 'Faculty', value: '200+' },
                { label: 'Countries', value: '30+' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: 'Srey Neang',
    role: 'Computer Science, Class of 2024',
    content: 'PPIU transformed my life. The quality of education and support from lecturers is unmatched. I graduated with the skills and confidence to pursue my dream career.',
    rating: 5,
  },
  {
    name: 'Vannak Som',
    role: 'Business Administration, Class of 2023',
    content: 'The global opportunities at PPIU are incredible. I participated in an exchange program in Singapore that broadened my horizons and opened doors I never imagined.',
    rating: 5,
  },
  {
    name: 'Chanthy Prak',
    role: 'Engineering, Class of 2024',
    content: 'The modern facilities and hands-on learning approach at PPIU gave me real-world experience that made me job-ready from day one after graduation.',
    rating: 5,
  },
];

function Testimonials() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What Our{' '}
            <span className="text-primary">Students Say</span>
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Hear from our graduates about their experiences at PPIU.
          </p>
        </ScrollReveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="bg-gray-50 rounded-2xl p-8 relative"
            >
              <Quote className="w-10 h-10 text-primary/20 absolute top-6 right-6" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-accent fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6 relative z-10">&ldquo;{t.content}&rdquo;</p>
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Get In{' '}
            <span className="text-primary">Touch</span>
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Have questions? We&apos;d love to hear from you. Reach out to us.
          </p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-12">
          <ScrollReveal>
            <div className="space-y-6">
              {[
                { icon: MapPin, title: 'Address', content: 'Russian Federation Blvd, Phnom Penh, Cambodia' },
                { icon: Phone, title: 'Phone', content: '+855 23 123 456' },
                { icon: Mail, title: 'Email', content: 'info@ppiu.edu.kh' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-600">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Send Us a Message</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    placeholder="First Name"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <input
                    placeholder="Last Name"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <input
                  placeholder="Email Address"
                  type="email"
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none focus:border-primary transition-colors"
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 gap-2">
                  Send Message <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-bold text-lg">PPIU</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Phnom Penh International University — Shaping the Future Through Quality Education.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['About Us', 'Programs', 'Admissions', 'Research'].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-accent transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Library', 'Campus Life', 'Scholarships', 'International'].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-accent transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-accent hover:text-accent-foreground transition-all text-xs font-medium"
                >
                  {s.charAt(0)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Phnom Penh International University. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Programs />
      <Statistics />
      <About />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}
