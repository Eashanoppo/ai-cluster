"use client";

import React from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Maximize, Grid } from "lucide-react";
import { motion } from "framer-motion";

interface SlideControlsProps {
  currentSlide: number;
  totalSlides: number;
  isPlaying: boolean;
  progress: number; // 0 to 100
  isFullscreen: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleFullscreen: () => void;
  onToggleGrid: () => void;
}

export const SlideControls: React.FC<SlideControlsProps> = ({
  currentSlide,
  totalSlides,
  isPlaying,
  progress,
  isFullscreen,
  onPlayPause,
  onNext,
  onPrev,
  onToggleFullscreen,
  onToggleGrid,
}) => {
  // If in Fullscreen mode, hide the control toolbar as requested
  if (isFullscreen) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-4">
      <div className="bg-[#e5e9f0]/90 backdrop-blur-md border border-[#d8dee9] rounded-2xl p-2 shadow-lg flex items-center justify-between">
        
        {/* Progress Bar & Play/Pause */}
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={onPlayPause}
            className="p-2.5 bg-[#eceff4] hover:bg-[#d8dee9] border border-[#d8dee9] text-[#5e81ac] rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5e81ac]"
            aria-label={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          
          <div className="flex-1 max-w-[200px] h-2 bg-[#d8dee9] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#5e81ac]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* Slide Counter & Navigation */}
        <div className="flex items-center space-x-3 px-4">
          <button
            onClick={onPrev}
            className="p-2 text-[#4c566a] hover:text-[#2e3440] hover:bg-[#d8dee9] rounded-lg transition-colors focus:outline-none"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-mono text-sm font-bold text-[#4c566a] min-w-[4rem] text-center">
            {currentSlide + 1} / {totalSlides}
          </span>
          
          <button
            onClick={onNext}
            className="p-2 text-[#4c566a] hover:text-[#2e3440] hover:bg-[#d8dee9] rounded-lg transition-colors focus:outline-none"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Extra Controls (Grid & Fullscreen) */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <button
            onClick={onToggleGrid}
            className="p-2.5 text-[#4c566a] hover:text-[#5e81ac] hover:bg-[#eceff4] border border-transparent hover:border-[#d8dee9] rounded-xl transition-all shadow-sm focus:outline-none"
            title="Grid Overview (G)"
            aria-label="Toggle Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="p-2.5 text-[#4c566a] hover:text-[#5e81ac] hover:bg-[#eceff4] border border-transparent hover:border-[#d8dee9] rounded-xl transition-all shadow-sm focus:outline-none"
            title="Fullscreen (F)"
            aria-label="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
