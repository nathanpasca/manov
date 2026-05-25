import React from 'react';
import { Globe, Database, Brain, Layout } from 'lucide-react';

const steps = [
    {
        id: 'scout',
        title: 'Scrape',
        icon: Globe,
        description:
            'Chapters are pulled from source sites using a browser automation tool.',
    },
    {
        id: 'core',
        title: 'Store',
        icon: Database,
        description:
            'A FastAPI backend keeps everything in PostgreSQL — novels, chapters, and user data.',
    },
    {
        id: 'brain',
        title: 'Translate',
        icon: Brain,
        description:
            'Raw text is fed through a local language model to produce readable English.',
    },
    {
        id: 'view',
        title: 'Read',
        icon: Layout,
        description:
            'The frontend renders chapters with customizable fonts, themes, and layout.',
    },
];

const ArchitectureSteps = () => {
    return (
        <div className="mx-auto w-full max-w-5xl">
            <h2 className="mb-12 text-center font-serif text-2xl font-bold text-stone-900 dark:text-white">
                How it works
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center rounded-xl border border-stone-100 bg-white p-6 text-center dark:border-white/5 dark:bg-white/5"
                        >
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-white/5">
                                <Icon className="h-4 w-4 text-stone-600 dark:text-stone-300" />
                            </div>
                            <h3 className="mb-2 font-serif text-lg font-bold text-stone-900 dark:text-white">
                                {step.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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
