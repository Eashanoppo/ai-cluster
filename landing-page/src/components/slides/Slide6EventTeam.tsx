"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, UserCheck, Code2, Palette, Megaphone, Trophy } from "lucide-react";

const teamMembers = [
  {
    name: "Golam Morshed Eashan",
    role: "Team Lead + Backend Dev",
    image: "/eashan.webp",
    objectPosition: "object-[center_20%]",
    icon: Code2,
    badgeColor: "#5e81ac",
    description: "Distributed node orchestration, experience synchronizer, & cluster API.",
  },
  {
    name: "Mahtabul Al Nahian",
    role: "UI/UX Designer + Frontend Dev",
    image: "/mahtab.webp",
    objectPosition: "object-[center_10%]",
    icon: Palette,
    badgeColor: "#8fbcbb",
    description: "Workstation interface, telemetry charts, & slide showcase.",
  },
  {
    name: "Sayma Ferdousi Fariha",
    role: "Developer + Representative",
    image: "/sayma.webp",
    objectPosition: "object-[center_25%]",
    icon: Megaphone,
    badgeColor: "#d08770",
    description: "Pipeline integration, testing, docs, & presentation lead.",
  },
];

export const Slide6EventTeam: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 sm:p-14 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Slide Header */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-4">
        <div className="flex items-center space-x-4">
          <span className="px-4 py-1.5 bg-[#5e81ac] text-white text-sm font-mono font-bold rounded-xl uppercase tracking-wider shadow-xs">
            Slide 06 // Event & Team
          </span>
          <span className="text-sm font-semibold text-[#4c566a] uppercase tracking-wider">
            DIU National Hackathon Showcase
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-[#5e81ac] font-bold bg-[#e5e9f0] px-4 py-1.5 rounded-xl border border-[#d8dee9]">
          <Trophy className="w-4 h-4 text-[#5e81ac]" />
          <span>Team UNLEFT</span>
        </div>
      </div>

      {/* Main Grid: Left Side Hackathon & Mentor (5 Columns), Right Side Team Roster (7 Columns) */}
      <div className="grid grid-cols-12 gap-8 my-auto w-full">
        {/* Left Side: Event Banner & Mentor Card (5 Columns) */}
        <div className="col-span-5 flex flex-col justify-between space-y-6">
          {/* Event Card */}
          <div className="bg-[#d8dee9] border border-[#5e81ac]/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-[#5e81ac] uppercase tracking-wider bg-[#eceff4] px-3 py-1 rounded-lg border border-[#5e81ac]/20">
                  National Competition
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-[#2e3440]">DIU National Hackathon</h3>
              <p className="text-sm lg:text-base text-[#3b4252] mt-2 leading-relaxed">
                Organized by Daffodil International University. ClustroConnect presents an autonomous AI cluster solution to pioneer self-healing distributed model training.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#e5e9f0]">
              <a
                href="https://hackathon.daffodilvarsity.edu.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5e81ac] hover:bg-[#81a1c1] text-[#eceff4] transition-all inline-flex items-center space-x-2 shadow-xs"
              >
                <span>Official Hackathon Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Mentor Card */}
          <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#5e81ac] shrink-0 bg-[#eceff4] shadow-xs">
                <Image
                  src="/Mentor.jpg"
                  alt="Md. Shahriar Parvez"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#d08770] uppercase tracking-wider block mb-0.5">
                  Faculty Guidance & Mentor
                </span>
                <h4 className="text-base font-bold text-[#2e3440]">Md. Shahriar Parvez</h4>
                <p className="text-xs font-semibold text-[#434c5e]">
                  Lecturer, Software Engineering
                </p>
                <p className="text-[10px] text-[#4c566a]">Daffodil International University</p>
              </div>
            </div>
            <UserCheck className="w-5 h-5 text-[#87a070] shrink-0" />
          </div>
        </div>

        {/* Right Side: 3 Team Members Cards (7 Columns) */}
        <div className="col-span-7 grid grid-cols-3 gap-5">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 relative flex flex-col justify-between shadow-sm h-full"
            >
              <div>
                <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 border border-[#e5e9f0] bg-[#eceff4]">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className={`object-cover ${member.objectPosition}`}
                  />
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-[#eceff4] truncate"
                    style={{
                      borderColor: `${member.badgeColor}40`,
                      color: member.badgeColor,
                    }}
                  >
                    {member.role.split('+')[0]}
                  </span>
                  <member.icon className="w-4 h-4 shrink-0" style={{ color: member.badgeColor }} />
                </div>

                <h4 className="text-sm font-bold text-[#2e3440] leading-snug">{member.name}</h4>
                <p className="text-xs text-[#434c5e] mt-2 leading-relaxed">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="pt-4 border-t border-[#d8dee9] flex items-center justify-between text-sm text-[#4c566a] font-medium">
        <span>Built by Team UNLEFT // Department of Software Engineering</span>
        <span className="font-mono text-[#5e81ac] font-bold">Daffodil International University</span>
      </div>
    </div>
  );
};
