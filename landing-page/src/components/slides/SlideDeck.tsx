"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { SlideFrame } from "./SlideFrame";
import { SlideControls } from "./SlideControls";

// Import 6 slides
import { Slide1Hero } from "./Slide1Hero";
import { Slide2Problems } from "./Slide2Problems";
import { Slide3Solutions } from "./Slide3Solutions";
import { Slide4Architecture } from "./Slide4Architecture";
import { Slide5Benchmarks } from "./Slide5Benchmarks";
import { Slide6EventTeam } from "./Slide6EventTeam";

const STANDARD_SLIDE_DURATION_MS = 7000; // 7 seconds for standard slides
const SLIDE_1_SIMULATION_DURATION_MS = 15200; // 15.2 seconds for Slide 1 cluster simulation cycle
const PROGRESS_UPDATE_INTERVAL_MS = 50;

export const SlideDeck: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isGridMode, setIsGridMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedProgressRef = useRef<number>(0);

  const totalSlides = 6;

  // Slide 1 has a longer duration matching its 4-phase cluster simulation
  const currentSlideDuration = currentIndex === 0 ? SLIDE_1_SIMULATION_DURATION_MS : STANDARD_SLIDE_DURATION_MS;

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides); // Infinite loop forward
    resetTimer();
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides); // Infinite loop backward
    resetTimer();
  }, [totalSlides]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        pausedProgressRef.current = progress;
      } else {
        startTimeRef.current = Date.now() - (pausedProgressRef.current / 100) * currentSlideDuration;
      }
      return !prev;
    });
  }, [progress, currentSlideDuration]);

  const resetTimer = useCallback(() => {
    setProgress(0);
    pausedProgressRef.current = 0;
    startTimeRef.current = Date.now();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const toggleGrid = useCallback(() => {
    setIsGridMode((prev) => !prev);
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "g" || e.key === "G") {
        toggleGrid();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, handlePlayPause, toggleFullscreen, toggleGrid]);

  // Auto-advance Timer Logic
  useEffect(() => {
    if (!isPlaying || isGridMode) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / currentSlideDuration) * 100, 100);
      
      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, PROGRESS_UPDATE_INTERVAL_MS);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, isGridMode, currentSlideDuration, handleNext]);

  // Build slides array with onSimulationComplete callback bound on Slide 1
  const slides = [
    <Slide1Hero key="s1" onSimulationComplete={handleNext} />,
    <Slide2Problems key="s2" />,
    <Slide3Solutions key="s3" />,
    <Slide4Architecture key="s4" />,
    <Slide5Benchmarks key="s5" />,
    <Slide6EventTeam key="s6" />,
  ];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen bg-[#eceff4] flex flex-col justify-between overflow-hidden ${isFullscreen ? 'p-0' : 'p-4 sm:p-6'}`}
      onMouseEnter={() => { if (isPlaying) handlePlayPause(); }}
      onMouseLeave={() => { if (!isPlaying) handlePlayPause(); }}
    >
      
      {isGridMode ? (
        // Grid Overview Mode
        <div className="w-full h-full overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max items-start">
          <div className="col-span-full flex justify-between items-center mb-4 border-b border-[#d8dee9] pb-4">
            <h2 className="text-2xl font-black text-[#2e3440]">Slide Overview</h2>
            <button 
              onClick={toggleGrid}
              className="px-4 py-2 bg-[#5e81ac] text-white rounded-xl font-bold hover:bg-[#81a1c1] transition-all"
            >
              Exit Grid (G)
            </button>
          </div>
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
                setIsGridMode(false);
                resetTimer();
              }}
              className={`cursor-pointer rounded-2xl overflow-hidden border-4 transition-all duration-300 transform hover:scale-105 shadow-md ${idx === currentIndex ? 'border-[#5e81ac] ring-4 ring-[#5e81ac]/20' : 'border-[#e5e9f0] hover:border-[#81a1c1]'}`}
              style={{ aspectRatio: '16/9' }}
            >
              <div className="w-full h-full pointer-events-none scale-[0.333] origin-top-left" style={{ width: '300%', height: '300%' }}>
                {slide}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Normal Presentation Mode
        <>
          {/* Main Slide Frame wrapper ensures 16:9 aspect ratio */}
          <SlideFrame direction={direction}>
            {slides[currentIndex]}
          </SlideFrame>
          
          {/* Bottom Control Bar */}
          <div className="mt-4 z-50">
            <SlideControls 
              currentSlide={currentIndex}
              totalSlides={totalSlides}
              isPlaying={isPlaying}
              progress={progress}
              isFullscreen={isFullscreen}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrev={handlePrev}
              onToggleFullscreen={toggleFullscreen}
              onToggleGrid={toggleGrid}
            />
          </div>
        </>
      )}
    </div>
  );
};
