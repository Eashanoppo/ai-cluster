'use client';

import React, { useEffect, useState } from 'react';

interface AIThinkingProps {
  onComplete: () => void;
  steps?: string[];
}

const DEFAULT_STEPS = [
  'Collecting telemetry from 128 GPUs...',
  'Analyzing thermal + VRAM profiles...',
  'Evaluating scheduling candidates...',
  'Decision generated.',
];

export function AIThinking({ onComplete, steps = DEFAULT_STEPS }: AIThinkingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let prog = 0;
    let stepIdx = 0;
    const STEP_DURATION = 600; // ms per step
    const TICK = 30;

    const timer = setInterval(() => {
      prog += (100 / (STEP_DURATION / TICK));
      if (prog >= 100) {
        prog = 0;
        stepIdx += 1;
        setProgress(0);
        if (stepIdx >= steps.length) {
          clearInterval(timer);
          setDone(true);
          setTimeout(onComplete, 400);
          return;
        }
        setCurrentStep(stepIdx);
      } else {
        setProgress(prog);
      }
    }, TICK);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="space-y-3 py-2">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep || done;
        return (
          <div key={i} className={`transition-all duration-300 ${i > currentStep && !done ? 'opacity-30' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isComplete ? 'bg-emerald-500' : isActive ? 'bg-primary animate-pulse' : 'bg-zinc-700'
              }`}>
                {isComplete ? (
                  <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-background' : 'bg-zinc-600'}`} />
                )}
              </div>
              <span className={`text-xs font-mono ${isComplete ? 'text-emerald-400' : isActive ? 'text-white' : 'text-zinc-500'}`}>
                {step}
              </span>
            </div>
            {isActive && !done && (
              <div className="ml-6 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
