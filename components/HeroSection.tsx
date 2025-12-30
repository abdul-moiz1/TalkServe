'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ReactNode } from 'react';

interface HeroSectionProps {
  title: string;
  highlightedText?: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  children?: ReactNode;
  badge?: ReactNode;
}

export default function HeroSection({
  title,
  highlightedText,
  description,
  imagePath,
  imageAlt,
  children,
  badge,
}: HeroSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-[calc(100vh-4rem)] flex items-center py-8 sm:py-12 pt-24 lg:pt-32">
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-40" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            {badge && (
              <motion.div variants={itemVariants} className="mb-6">
                {badge}
              </motion.div>
            )}
            
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight"
            >
              {title}
              {highlightedText && (
                <>
                  {' '}
                  <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {highlightedText}
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed max-w-xl"
            >
              {description}
            </motion.p>

            {children && (
              <motion.div variants={itemVariants}>
                {children}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            <div className="relative aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10">
              <Image
                src={imagePath}
                alt={imageAlt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent mix-blend-overlay" />
            </div>
            
            <div className="absolute -bottom-4 -right-4 w-64 h-64 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-4 -left-4 w-48 h-48 bg-blue-400/20 dark:bg-blue-400/10 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
