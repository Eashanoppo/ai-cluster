"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, GraduationCap, ExternalLink, Code2, Palette, Megaphone, UserCheck } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

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
    objectPosition: "object-[center_10%]", // Pushed down further as requested
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

export const EventTeam: React.FC = () => {
  return (
    <AnimatedSection id="team" className="py-24 border-t border-[#d8dee9]">
      {/* Section Title */}
      <div className="text-center max-w-3xl mx-auto mb-16 w-full">
        <h2 className="text-4xl sm:text-5xl font-black text-[#2e3440] tracking-tight">
          Meet Team UNLEFT & Project Details
        </h2>
        <p className="mt-4 text-lg text-[#434c5e] leading-relaxed">
          Proudly built for the DIU National Hackathon by Software Engineering innovators from Daffodil International University.
        </p>
      </div>

      {/* Event Details Card with Hackathon Image */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-[#d8dee9] border border-[#5e81ac]/40 rounded-2xl p-8 mb-16 relative overflow-hidden shadow-sm w-full"
      >
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <h3 className="text-3xl font-black text-[#2e3440]">DIU National Hackathon</h3>
            <p className="text-base text-[#3b4252] mt-3 leading-relaxed">
              Organized by Daffodil International University. ClustroConnect presents an autonomous AI cluster solution to pioneer self-healing distributed model training.
            </p>
            <div className="mt-6">
              <a
                href="https://hackathon.daffodilvarsity.edu.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl text-xs font-bold bg-[#5e81ac] hover:bg-[#81a1c1] text-[#eceff4] transition-all inline-flex items-center space-x-2 shadow-md"
              >
                <span>Visit Official Hackathon Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-[#e5e9f0] bg-white shadow-md p-4 flex items-center justify-center">
              <Image
                src="/hackathon.jpg"
                alt="DIU National Hackathon"
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Team Roster Grid with Member Photos */}
      <div className="mb-16 w-full">
        <div className="flex items-center space-x-3 mb-8">
          <Users className="w-6 h-6 text-[#5e81ac]" />
          <h3 className="text-2xl font-bold text-[#2e3440]">Team UNLEFT Roster</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: false }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-6 relative flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="relative w-full h-56 rounded-xl overflow-hidden mb-6 border border-[#e5e9f0] bg-[#eceff4]">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className={`object-cover ${member.objectPosition}`}
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-mono font-bold px-3 py-1 rounded-md border bg-[#eceff4]"
                    style={{
                      borderColor: `${member.badgeColor}40`,
                      color: member.badgeColor,
                    }}
                  >
                    {member.role}
                  </span>
                </div>

                <h4 className="text-xl font-bold text-[#2e3440]">{member.name}</h4>
                <p className="text-xs text-[#434c5e] mt-3 leading-relaxed">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mentor Details Card with Mentor Image */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs w-full"
      >
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#5e81ac] shrink-0 bg-[#eceff4] shadow-md">
            <Image
              src="/Mentor.jpg"
              alt="Md. Shahriar Parvez"
              fill
              className="object-cover object-top"
            />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#d08770] uppercase tracking-wider block mb-1">Faculty Guidance & Mentor</span>
            <h4 className="text-2xl font-bold text-[#2e3440]">Md. Shahriar Parvez</h4>
            <p className="text-sm font-semibold text-[#434c5e] mt-0.5">
              Lecturer, Department of Software Engineering
            </p>
            <p className="text-xs text-[#4c566a]">Daffodil International University</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[#87a070] bg-[#eceff4] px-4 py-2 rounded-xl border border-[#e5e9f0] font-bold">
          <UserCheck className="w-4 h-4" />
          <span>Faculty Mentor Verified</span>
        </div>
      </motion.div>
    </AnimatedSection>
  );
};
