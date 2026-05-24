import React from 'react';
import { motion } from 'framer-motion';
import { Factory } from 'lucide-react';
import ArchitectureSlideshow from '../components/ArchitectureSlideshow';

const About = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
            },
        },
    };

    const pipelineVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                duration: 2,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'loop',
                repeatDelay: 1,
            },
        },
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gray-50 pb-20 pt-24 font-sans text-gray-900 transition-colors duration-300 dark:bg-transparent dark:text-gray-100">
            {/* Background Elements */}
            <div className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full overflow-hidden">
                <div className="absolute right-[-10%] top-[-10%] h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
            </div>

            <motion.div
                className="container relative z-10 mx-auto max-w-4xl px-4 py-16"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div
                    variants={itemVariants}
                    className="mb-24 text-center"
                >
                    <h1 className="mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text py-2 text-5xl font-bold text-transparent md:text-7xl">
                        Bridging Worlds with AI
                    </h1>
                    <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
                        The future of reading is automated, instant, and
                        borderless.
                    </p>
                </motion.div>

                {/* The Story Card - Redesigned */}
                <motion.div variants={itemVariants} className="mb-16">
                    <div className="group relative">
                        {/* Gradient Border Effect */}
                        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-sm transition duration-500 group-hover:opacity-60"></div>

                        <div className="relative overflow-hidden rounded-3xl bg-white p-8 md:p-12 dark:bg-[#0a0a0a]">
                            {/* Decorative Grid Background */}
                            <div
                                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1]"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(#6366f1 1px, transparent 1px)',
                                    backgroundSize: '24px 24px',
                                }}
                            ></div>

                            {/* Large Watermark */}
                            <div className="pointer-events-none absolute -right-6 -top-6 select-none text-9xl font-bold text-gray-100 dark:text-white/5">
                                01
                            </div>

                            <div className="relative z-10">
                                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-500">
                                    The Origin Story
                                </h2>
                                <p className="mb-8 text-2xl font-bold leading-tight text-gray-900 md:text-3xl dark:text-white">
                                    Manov was born out of a simple human
                                    emotion:{' '}
                                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                        impatience
                                    </span>
                                    .
                                </p>

                                <div className="border-l-4 border-blue-500/30 pl-6">
                                    <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                                        I wanted to read the latest chapter of
                                        my favorite novel without waiting days
                                        or weeks for a manual translation. So, I
                                        built my own "factory": an automated
                                        system that takes raw chapters and fuses
                                        them with advanced LLMs to deliver
                                        stories instantly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* The Architecture Slideshow */}
                <motion.div variants={itemVariants} className="mb-24">
                    <ArchitectureSlideshow />
                </motion.div>

                {/* Disclaimer */}
                <motion.div variants={itemVariants}>
                    <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-red-50/50 p-6 backdrop-blur-sm dark:bg-black/30">
                        <div className="absolute left-0 top-0 h-full w-1 bg-red-500/50" />
                        <h3 className="mb-2 flex items-center gap-2 font-mono font-bold text-red-600 dark:text-red-400">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                            SYSTEM_DISCLAIMER
                        </h3>
                        <p className="font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-400">
                            Remember, the translator is a robot, not a human.
                            Sometimes it's brilliant, sometimes it's
                            hallucinating. If you find a strange sentence, just
                            consider it the{' '}
                            <span className="font-bold text-red-600 dark:text-red-300">
                                "spice"
                            </span>{' '}
                            of future technology.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default About;
