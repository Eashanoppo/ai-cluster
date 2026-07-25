"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Code2, Palette, Megaphone } from "lucide-react";

const teamMembers = [
  {
    name: "Golam Morshed Eashan",
    role: "Team Lead + Backend Dev",
    image: "/eashan.webp",
    objectPosition: "object-[center_20%]",
    icon: Code2,
    badgeColor: "#5e81ac",
    description: "Distributed node orchestration, experience replay synchronizer, and backend cluster API architecture.",
  },
  {
    name: "Mahtabul Al Nahian",
    role: "UI/UX Designer + Frontend Dev",
    image: "/mahtab.webp",
    objectPosition: "object-[center_10%]",
    icon: Palette,
    badgeColor: "#8fbcbb",
    description: "Crafted the workstation interface, telemetry visualization, and responsive landing showcase.",
  },
  {
    name: "Sayma Ferdousi Fariha",
    role: "Developer + Representative",
    image: "/sayma.webp",
    objectPosition: "object-[center_25%]",
    icon: Megaphone,
    badgeColor: "#d08770",
    description: "Technical representative, pipeline integration testing, documentation, and hackathon presentation lead.",
  },
];

export const Slide7Team: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-8 sm:p-10 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Slide Header */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-3">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-[#5e81ac] text-white text-xs font-mono font-bold rounded-lg uppercase tracking-wider">
            Slide 07 // The Team
          </span>
          <span className="text-xs font-semibold text-[#4c566a] uppercase tracking-wider">
            Builders of ClustroConnect
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-[#5e81ac] font-bold">
          <Users className="w-4 h-4 text-[#5e81ac]" />
          <span>Team UNLEFT</span>
        </div>
      </div>

      {/* Header Title */}
      <div className="text-center my-2">
        <h2 className="text-2xl sm:text-3xl font-black text-[#2e3440] tracking-tight">
          Team UNLEFT Roster
        </h2>
        <p className="text-xs sm:text-sm text-[#434c5e] mt-1">
          The brilliant minds from Daffodil International University who brought ClustroConnect to life.
        </p>
      </div>

      {/* 3-Column Team Roster Grid */}
      <div className="grid grid-cols-3 gap-5 my-auto w-full">
        {teamMembers.map((member, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 relative flex flex-col justify-between shadow-xs h-full"
          >
            <div>
              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 border border-[#e5e9f0] bg-[#eceff4]">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className={`object-cover ${member.objectPosition}`}
                />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-mono font-bold px-2 py-1 rounded-md border bg-[#eceff4]"
                  style={{
                    borderColor: `${member.badgeColor}40`,
                    color: member.badgeColor,
                  }}
                >
                  {member.role}
                </span>
                <member.icon className="w-4 h-4" style={{ color: member.badgeColor }} />
              </div>

              <h4 className="text-lg font-bold text-[#2e3440]">{member.name}</h4>
              <p className="text-xs text-[#434c5e] mt-2 leading-relaxed">{member.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Banner */}
      <div className="pt-3 border-t border-[#d8dee9] flex items-center justify-between text-xs text-[#4c566a] font-medium">
        <span>Software Engineering Department</span>
        <span className="font-mono text-[#5e81ac] font-bold">Daffodil International University</span>
      </div>
    </div>
  );
};
