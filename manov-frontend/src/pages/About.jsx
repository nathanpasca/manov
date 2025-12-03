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
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop",
                repeatDelay: 1
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 bg-gray-50 dark:bg-transparent text-gray-900 dark:text-gray-100 pb-20 font-sans transition-colors duration-300 overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
            </div>

            <motion.div
                className="container mx-auto px-4 py-16 relative z-10 max-w-4xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-24">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 py-2">
                        Bridging Worlds with AI
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        The future of reading is automated, instant, and borderless.
                    </p>
                </motion.div>

                {/* The Story Card - Redesigned */}
                <motion.div variants={itemVariants} className="mb-16">
                    <div className="relative group">
                        {/* Gradient Border Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-60 transition duration-500 blur-sm"></div>

                        <div className="relative bg-white dark:bg-[#0a0a0a] rounded-3xl p-8 md:p-12 overflow-hidden">
                            {/* Decorative Grid Background */}
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1]"
                                style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                            </div>

                            {/* Large Watermark */}
                            <div className="absolute -top-6 -right-6 text-9xl font-bold text-gray-100 dark:text-white/5 select-none pointer-events-none">
                                01
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-4">
                                    The Origin Story
                                </h2>
                                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-8">
                                    Manov was born out of a simple human emotion: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">impatience</span>.
                                </p>

                                <div className="pl-6 border-l-4 border-blue-500/30">
                                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                        I wanted to read the latest chapter of my favorite novel without waiting days or weeks for a manual translation. So, I built my own "factory": an automated system that takes raw chapters and fuses them with advanced LLMs to deliver stories instantly.
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
                    <div className="bg-red-50/50 dark:bg-black/30 border border-red-500/20 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                        <h3 className="text-red-600 dark:text-red-400 font-mono font-bold mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            SYSTEM_DISCLAIMER
                        </h3>
                        <p className="text-gray-700 dark:text-gray-400 font-mono text-sm leading-relaxed">
                            Remember, the translator is a robot, not a human. Sometimes it's brilliant, sometimes it's hallucinating. If you find a strange sentence, just consider it the <span className="text-red-600 dark:text-red-300 font-bold">"spice"</span> of future technology.
                        </p>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default About;
