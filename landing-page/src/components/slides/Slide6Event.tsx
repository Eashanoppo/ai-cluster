"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, UserCheck, Calendar } from "lucide-react";

export const Slide6Event: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-8 sm:p-10 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Slide Header */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-3">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-[#5e81ac] text-white text-xs font-mono font-bold rounded-lg uppercase tracking-wider">
            Slide 06 // Event
          </span>
          <span className="text-xs font-semibold text-[#4c566a] uppercase tracking-wider">
            DIU National Hackathon Showcase
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-[#5e81ac] font-bold">
          <Calendar className="w-4 h-4 text-[#5e81ac]" />
          <span>Event Details</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col justify-center space-y-6 my-4">
        {/* Hackathon Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#d8dee9] border border-[#5e81ac]/40 rounded-2xl p-6 relative overflow-hidden shadow-xs flex items-center gap-6"
        >
          <div className="flex-1">
            <h3 className="text-3xl font-black text-[#2e3440]">DIU National Hackathon</h3>
            <p className="text-sm text-[#3b4252] mt-2 leading-relaxed">
              Organized by Daffodil International University. ClustroConnect presents an autonomous AI cluster solution to pioneer self-healing distributed model training.
            </p>
            <div className="mt-4">
              <a
                href="https://hackathon.daffodilvarsity.edu.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5e81ac] hover:bg-[#81a1c1] text-[#eceff4] transition-all inline-flex items-center space-x-2 shadow-sm"
              >
                <span>Visit Official Hackathon Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="w-1/3">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#e5e9f0] bg-white shadow-xs p-2 flex items-center justify-center">
              <Image
                src="/hackathon.jpg"
                alt="DIU National Hackathon"
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
        </motion.div>

        {/* Mentor Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-6 flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center space-x-5">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#5e81ac] shrink-0 bg-[#eceff4] shadow-xs">
              <Image
                src="/Mentor.jpg"
                alt="Md. Shahriar Parvez"
                fill
                className="object-cover object-top"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#d08770] uppercase tracking-wider block mb-1">
                Faculty Guidance & Mentor
              </span>
              <h4 className="text-xl font-bold text-[#2e3440]">Md. Shahriar Parvez</h4>
              <p className="text-xs font-semibold text-[#434c5e] mt-0.5">
                Lecturer, Department of Software Engineering
              </p>
              <p className="text-[10px] text-[#4c566a]">Daffodil International University</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-[#87a070] bg-[#eceff4] px-4 py-2 rounded-xl border border-[#e5e9f0] font-bold">
            <UserCheck className="w-4 h-4" />
            <span>Faculty Mentor Verified</span>
          </div>
        </motion.div>
      </div>

      {/* Footer Banner */}
      <div className="pt-3 border-t border-[#d8dee9] flex items-center justify-between text-xs text-[#4c566a] font-medium">
        <span>Project Built for the DIU National Hackathon</span>
        <span className="font-mono text-[#5e81ac] font-bold">Department of Software Engineering</span>
      </div>
    </div>
  );
};
