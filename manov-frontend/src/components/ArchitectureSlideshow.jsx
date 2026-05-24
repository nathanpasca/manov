import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    Database,
    Brain,
    Layout,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

const steps = [
    {
        id: 'scout',
        title: 'The Scout',
        subtitle: 'Automated Scraping',
        icon: Globe,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        description:
            'Powered by Playwright, our scout navigates the web like a human. It handles dynamic content, bypasses basic protections, and extracts raw chapters with surgical precision.',
    },
    {
        id: 'core',
        title: 'The Core',
        subtitle: 'Orchestration Engine',
        icon: Database,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        description:
            'FastAPI serves as the central nervous system. It manages the job queue, stores novel metadata in PostgreSQL via Prisma, and ensures efficient data flow between services.',
    },
    {
        id: 'brain',
        title: 'The Brain',
        subtitle: 'AI Translation',
        icon: Brain,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
        description:
            'Raw text is fed into advanced LLMs. Unlike basic machine translation, it understands context, tone, and nuance, turning rough raw chapters into smooth, readable prose.',
    },
    {
        id: 'view',
        title: 'The View',
        subtitle: 'Immersive Reader',
        icon: Layout,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        description:
            'Delivered via React & Tailwind. The frontend provides a distraction-free environment with customizable themes, fonts, and instant loading speeds.',
    },
];

const ArchitectureSlideshow = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-play logic
    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % steps.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isHovered]);

    const nextSlide = () =>
        setCurrentIndex((prev) => (prev + 1) % steps.length);
    const prevSlide = () =>
        setCurrentIndex((prev) => (prev - 1 + steps.length) % steps.length);

    const currentStep = steps[currentIndex];
    const Icon = currentStep.icon;

    return (
        <div className="mx-auto w-full max-w-4xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
                System Architecture
            </h2>

            <div
                className="perspective-1000 relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* 3D Card Container */}
                <motion.div
                    className="relative flex min-h-[400px] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl md:flex-row dark:border-gray-800 dark:bg-gray-900"
                    initial={false}
                    animate={{
                        rotateX: isHovered ? 2 : 0,
                        rotateY: isHovered ? 2 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    {/* Left Side: Visual & Icon */}
                    <div
                        className={`relative flex w-full flex-col items-center justify-center overflow-hidden p-8 md:w-1/3 ${currentStep.bg} transition-colors duration-500`}
                    >
                        {/* Animated Background Pulse */}
                        <div
                            className={`absolute inset-0 opacity-30 ${currentStep.bg} animate-pulse`}
                        ></div>

                        <motion.div
                            key={currentStep.id}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                            }}
                            className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full border-4 bg-white shadow-lg dark:bg-gray-900 ${currentStep.border}`}
                        >
                            <Icon
                                className={`h-16 w-16 ${currentStep.color} drop-shadow-lg`}
                            />
                        </motion.div>
                    </div>

                    {/* Right Side: Content */}
                    <div className="relative flex w-full flex-col justify-center p-8 md:w-2/3 md:p-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3
                                        className={`mb-2 text-sm font-bold uppercase tracking-wider ${currentStep.color}`}
                                    >
                                        {currentStep.subtitle}
                                    </h3>
                                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {currentStep.title}
                                    </h2>
                                </div>
                                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                                    {currentStep.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Controls */}
                        <div className="absolute bottom-6 right-6 flex gap-2">
                            <button
                                onClick={prevSlide}
                                className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                <ChevronLeft className="h-6 w-6 text-gray-500" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                <ChevronRight className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Progress Indicators */}
                <div className="mt-8 flex justify-center gap-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            onClick={() => setCurrentIndex(index)}
                            className="group flex cursor-pointer flex-col items-center gap-2"
                        >
                            <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                <motion.div
                                    className={`h-full ${step.bg.replace('/10', '')}`} // Use solid color
                                    initial={{ width: '0%' }}
                                    animate={{
                                        width:
                                            index === currentIndex
                                                ? '100%'
                                                : '0%',
                                        backgroundColor:
                                            index === currentIndex
                                                ? 'currentColor'
                                                : 'transparent',
                                    }}
                                    transition={{
                                        duration:
                                            index === currentIndex ? 5 : 0.3,
                                        ease: 'linear',
                                    }}
                                />
                            </div>
                            <span
                                className={`text-xs font-medium transition-colors ${index === currentIndex ? step.color : 'text-gray-400'}`}
                            >
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ArchitectureSlideshow;
