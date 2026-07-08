'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Home, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8"
        >
          <GraduationCap className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-7xl font-bold text-primary mb-2">404</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
            moved or doesn&apos;t exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
                <Home className="w-4 h-4" /> Back to Home
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <Search className="w-4 h-4" /> Browse Programs
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
