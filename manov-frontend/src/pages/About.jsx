import React from 'react';
import { motion } from 'framer-motion';
import ArchitectureSteps from '../components/ArchitectureSlideshow';
import SEO from '../components/SEO';

const About = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 pt-28 font-sans text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-gray-100">
            <SEO
                title="About"
                description="Learn about Manov — a free web novel reader with AI-translated chapters. Built for readers who hate waiting for translations."
                url={`${import.meta.env.VITE_FRONTEND_URL || 'https://manov.pascarz.site'}/about`}
            />
            <div className="mx-auto max-w-3xl px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-16"
                >
                    <h1 className="mb-4 font-serif text-4xl font-bold text-gray-900 md:text-5xl dark:text-white">
                        About Manov
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        A place to read translated web novels, built by someone
                        who got tired of waiting for the next chapter.
                    </p>
                </motion.div>

                {/* Story */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-20"
                >
                    <div className="flex flex-col gap-10 md:flex-row md:gap-16">
                        <div className="md:w-2/3">
                            <p className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                                I started Manov because I was deep into a web
                                novel that had hundreds of raw chapters released
                                in Chinese, but only a handful translated into
                                English. Waiting weeks for each new translation
                                felt unbearable.
                            </p>
                            <p className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                                So I built a pipeline: scrape the raw text, run
                                it through a translation model, clean it up, and
                                serve it in a reader that actually feels nice to
                                use. No paywalls, no clutter, just the story.
                            </p>
                            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                                It started as a personal tool, but I figured
                                other people might find it useful too. If
                                you&apos;re here, you probably know the feeling.
                            </p>
                        </div>

                        <div className="md:w-1/3">
                            <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-white/5">
                                <p className="mb-1 text-sm text-gray-400 dark:text-gray-500">
                                    Built with
                                </p>
                                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <li>FastAPI & SQLModel</li>
                                    <li>PostgreSQL</li>
                                    <li>React & Tailwind</li>
                                    <li>Local LLM inference</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Divider */}
                <div className="mb-20 border-t border-gray-200 dark:border-white/10" />

                {/* How it works */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-20"
                >
                    <ArchitectureSteps />
                </motion.div>

                {/* Divider */}
                <div className="mb-16 border-t border-gray-200 dark:border-white/10" />

                {/* Disclaimer */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <p className="text-sm leading-relaxed text-gray-400 dark:text-gray-500">
                        The translations on this site are generated by AI.
                        They&apos;re good enough to follow the story, but
                        you&apos;ll probably spot the occasional awkward phrase
                        or odd name. If something reads strangely, just imagine
                        it as the machine&apos;s unique interpretation —
                        sometimes it even adds a little accidental poetry.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
