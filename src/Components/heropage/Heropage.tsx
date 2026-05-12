"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  FlaskConical,
  Sparkles,
  Code2,
  Zap,
  Layers3,
  Code2Icon,
} from "lucide-react";

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    x: 40,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const featureVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const features = [
  {
    icon: FlaskConical,
    title: "Experiment First",
    desc: "Use this repo to quickly test new UI concepts, AI workflows, frontend patterns, and performance ideas.",
  },
  {
    icon: Zap,
    title: "Animation Driven",
    desc: "Designed with animation libraries like Framer Motion and React Spring in mind for delightful interactions.",
  },
  {
    icon: Code2,
    title: "Modern Stack",
    desc: "Powered by Next.js, React, TypeScript, Tailwind CSS, and reusable component architecture.",
  },
];

const Heropage = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.22),transparent_35%)]" />

      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-0 h-125 w-125 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]"
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[100rem] flex-col px-6 py-8 lg:px-8">
        {/* Navbar */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate: 8,
                scale: 1.05,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 16,
              }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur">
              <FlaskConical className="h-5 w-5 text-cyan-300" />
            </motion.div>

            <div>
              <p className="text-sm font-semibold tracking-wide">
                AI Efficiency
              </p>
              <p className="text-xs text-white/50">Experimental Repo</p>
            </div>
          </div>

          <a
            href="#experiments"
            className="hidden rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white/80 backdrop-blur transition hover:bg-white/15 md:inline-flex">
            Explore Experiments
          </a>
        </motion.nav>

        {/* Hero */}
        <div className="grid flex-1 items-center gap-14 py-20 lg:grid-cols-2 lg:py-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl">
            <motion.div
              variants={itemVariants}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Built for experiments, ideas, and rapid iteration
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              A playground for{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-pink-300 bg-clip-text text-transparent">
                AI efficiency
              </span>{" "}
              experiments.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              This repository is a creative lab for testing ideas, building
              prototypes, exploring performance improvements, and experimenting
              with modern frontend patterns using Next.js, React, TypeScript,
              Tailwind CSS, Framer Motion, and animation-driven interfaces.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-9 flex flex-col gap-4 sm:flex-row">
              <motion.a
                href="#experiments"
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 18,
                }}
                className="group inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-2xl shadow-cyan-500/20">
                View Experiments
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </motion.a>

              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 18,
                }}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15">
                <Code2Icon className="mr-2 h-4 w-4" />
                Open Repository
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Visual card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative mx-auto w-full max-w-xl">
            <motion.div
              animate={{
                y: [0, -18, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative rounded-4xl border border-white/10 bg-white/8 p-4 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-white/40">
                    experiments.config.ts
                  </span>
                </div>

                <div className="space-y-4 font-mono text-sm">
                  <div className="rounded-xl bg-white/4 p-4">
                    <p className="text-pink-300">const repo = &#123;</p>

                    <p className="pl-5 text-cyan-200">
                      purpose:{" "}
                      <span className="text-emerald-300">
                        &quot;experimentation&quot;
                      </span>
                      ,
                    </p>

                    <p className="pl-5 text-cyan-200">
                      stack:{" "}
                      <span className="text-emerald-300">
                        [&quot;Next.js&quot;, &quot;React&quot;,
                        &quot;TypeScript&quot;]
                      </span>
                      ,
                    </p>

                    <p className="pl-5 text-cyan-200">
                      motion:{" "}
                      <span className="text-emerald-300">
                        &quot;Framer Motion&quot;
                      </span>
                      ,
                    </p>

                    <p className="text-pink-300">&#125;</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <motion.div
                      whileHover={{
                        y: -6,
                        scale: 1.03,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center">
                      <Code2 className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                      <p className="text-xs text-white/60">Prototype</p>
                    </motion.div>

                    <motion.div
                      whileHover={{
                        y: -6,
                        scale: 1.03,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-4 text-center">
                      <Zap className="mx-auto mb-2 h-5 w-5 text-indigo-300" />
                      <p className="text-xs text-white/60">Optimize</p>
                    </motion.div>

                    <motion.div
                      whileHover={{
                        y: -6,
                        scale: 1.03,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      className="rounded-xl border border-pink-400/20 bg-pink-400/10 p-4 text-center">
                      <Layers3 className="mx-auto mb-2 h-5 w-5 text-pink-300" />
                      <p className="text-xs text-white/60">Iterate</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <motion.div
              animate={{
                y: [0, 14, 0],
                rotate: [0, 3, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -right-3 -top-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm shadow-xl backdrop-blur md:-right-8">
              React + Motion
            </motion.div>

            <motion.div
              animate={{
                y: [0, -14, 0],
                rotate: [0, -3, 0],
              }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-6 -left-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm shadow-xl backdrop-blur md:-left-8">
              Tailwind Ready
            </motion.div>
          </motion.div>
        </div>

        {/* Feature section */}
        <motion.div
          id="experiments"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
          variants={containerVariants}
          className="grid gap-4 pb-10 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                variants={featureVariants}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                }}
                className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/55">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Heropage;
