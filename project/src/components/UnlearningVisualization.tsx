import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Circle } from 'lucide-react';

interface Step {
    id: string;
    label: string;
    status: 'waiting' | 'processing' | 'completed';
}

interface UnlearningVisualizationProps {
    steps: Step[];
    currentStepId: string;
}

export function UnlearningVisualization({ steps, currentStepId }: UnlearningVisualizationProps) {
    return (
        <div className="w-full max-w-3xl mx-auto my-8">
            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full" />

                {/* Active Progress Bar */}
                <motion.div
                    className="absolute top-1/2 left-0 h-1 bg-[#2F80ED] -translate-y-1/2 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{
                        width: `${(steps.findIndex(s => s.id === currentStepId) / (steps.length - 1)) * 100}%`
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const isCompleted = step.status === 'completed';
                        const isProcessing = step.status === 'processing';
                        const isWaiting = step.status === 'waiting';

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isProcessing ? 1.2 : 1,
                                        backgroundColor: isCompleted || isProcessing ? '#2F80ED' : '#FFFFFF',
                                        borderColor: isCompleted || isProcessing ? '#2F80ED' : '#E5E7EB'
                                    }}
                                    className={`w-10 h-10 rounded-full border-4 flex items-center justify-center z-10 transition-colors duration-300 ${isWaiting ? 'bg-white border-gray-200' : ''
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    ) : isProcessing ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-gray-300" />
                                    )}
                                </motion.div>
                                <motion.span
                                    className={`mt-2 text-sm font-medium ${isProcessing || isCompleted ? 'text-[#2F80ED]' : 'text-gray-400'
                                        }`}
                                    animate={{ opacity: isProcessing || isCompleted ? 1 : 0.7 }}
                                >
                                    {step.label}
                                </motion.span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
