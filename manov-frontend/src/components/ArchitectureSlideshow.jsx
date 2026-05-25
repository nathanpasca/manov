import React from 'react';
import { Globe, Database, Brain, Layout } from 'lucide-react';

const steps = [
    {
        id: 'scout',
        title: 'Scrape',
        icon: Globe,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        description:
            'Chapters are pulled from source sites using a browser automation tool.',
    },
    {
        id: 'core',
        title: 'Store',
        icon: Database,
        color: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        description:
            'A FastAPI backend keeps everything in PostgreSQL — novels, chapters, and user data.',
    },
    {
        id: 'brain',
        title: 'Translate',
        icon: Brain,
        color: 'text-pink-600',
        bg: 'bg-pink-50 dark:bg-pink-950/30',
        description:
            'Raw text is fed through a local language model to produce readable English.',
    },
    {
        id: 'view',
        title: 'Read',
        icon: Layout,
        color: 'text-green-600',
        bg: 'bg-green-50 dark:bg-green-950/30',
        description:
            'The frontend renders chapters with customizable fonts, themes, and layout.',
    },
];

const ArchitectureSteps = () => {
    return (
        <div className="mx-auto w-full max-w-5xl">
            <h2 className="mb-12 text-center font-serif text-2xl font-bold text-gray-900 dark:text-white">
                How it works
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center dark:border-white/5 dark:bg-white/5"
                        >
                            <div
                                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${step.bg}`}
                            >
                                <Icon className={`h-5 w-5 ${step.color}`} />
                            </div>
                            <h3 className="mb-2 font-serif text-lg font-bold text-gray-900 dark:text-white">
                                {step.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                {step.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ArchitectureSteps;
